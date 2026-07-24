-- Migration 007: Create verification and moderation tables
-- Purpose: Profile badges, verification tracking, and abuse reporting

-- Create ENUM types
CREATE TYPE verification_method_enum AS ENUM (
  'manual_admin',
  'id_document',
  'phone_verified',
  'email_verified',
  'none'
);
CREATE TYPE report_type_enum AS ENUM (
  'fake_profile',
  'inappropriate_content',
  'harassment',
  'scam',
  'catfish',
  'other'
);
CREATE TYPE report_status_enum AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

-- ============================================================================
-- TABLE: profile_verification
-- Purpose: Track verification badges and admin approval status
-- Linked to: users (1:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method verification_method_enum DEFAULT 'none',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  needs_recheck BOOLEAN DEFAULT FALSE,
  recheck_requested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT verified_at_required_if_verified CHECK (
    is_verified = FALSE OR verified_at IS NOT NULL
  ),
  CONSTRAINT notes_only_if_verified CHECK (
    is_verified = TRUE OR verification_notes IS NULL
  )
);

-- Add comments
COMMENT ON TABLE public.profile_verification IS 'Admin verification status and badge tracking. One per user. Separate from profile data for independent updates.';
COMMENT ON COLUMN public.profile_verification.is_verified IS 'Whether user has the verified badge';
COMMENT ON COLUMN public.profile_verification.verification_method IS 'How the user was verified (manual, ID doc, phone, email)';
COMMENT ON COLUMN public.profile_verification.needs_recheck IS 'Flag to request re-verification of existing verified profile';

-- Create indexes
CREATE INDEX idx_profile_verification_user_id ON public.profile_verification(user_id);
CREATE INDEX idx_profile_verification_is_verified ON public.profile_verification(is_verified);
CREATE INDEX idx_profile_verification_verified_at ON public.profile_verification(verified_at DESC);
CREATE INDEX idx_profile_verification_needs_recheck ON public.profile_verification(needs_recheck)
  WHERE needs_recheck = TRUE;

-- ============================================================================
-- TABLE: reports
-- Purpose: User-generated abuse/spam reports with admin workflow
-- Linked to: users (N:1 from both reporter and reported)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type report_type_enum NOT NULL,
  description TEXT NOT NULL,
  status report_status_enum DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT cannot_report_self CHECK (reported_by != reported_user_id),
  CONSTRAINT description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  CONSTRAINT resolution_notes_only_if_resolved CHECK (
    status = 'open' OR status = 'under_review' OR resolution_notes IS NOT NULL
  ),
  CONSTRAINT resolved_at_only_if_resolved CHECK (
    status IN ('open', 'under_review') OR resolved_at IS NOT NULL
  )
);

-- Add comments
COMMENT ON TABLE public.reports IS 'Abuse/spam reports submitted by users. Admin queue for investigation and action.';
COMMENT ON COLUMN public.reports.report_type IS 'Category of report for triage (fake, harassment, scam, catfish, inappropriate, other)';
COMMENT ON COLUMN public.reports.status IS 'open = new, under_review = admin investigating, resolved = action taken, dismissed = false report';

-- Create indexes
CREATE INDEX idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_reports_report_type ON public.reports(report_type);
CREATE INDEX idx_reports_open_queue ON public.reports(created_at DESC) WHERE status IN ('open', 'under_review');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on profile_verification table
ALTER TABLE public.profile_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own verification status
CREATE POLICY "profile_verification_own_read" ON public.profile_verification
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Verified status is public (everyone can see who's verified)
CREATE POLICY "profile_verification_public_read" ON public.profile_verification
  FOR SELECT
  USING (is_verified = TRUE);

-- RLS Policy: Admin/system only for write operations
CREATE POLICY "profile_verification_admin_write" ON public.profile_verification
  FOR ALL
  WITH CHECK (TRUE);

-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read reports they submitted
CREATE POLICY "reports_own_read" ON public.reports
  FOR SELECT
  USING (auth.uid() = reported_by);

-- RLS Policy: Reported users can see reports against them
CREATE POLICY "reports_target_read" ON public.reports
  FOR SELECT
  USING (auth.uid() = reported_user_id);

-- RLS Policy: Users can submit reports
CREATE POLICY "reports_own_write" ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- RLS Policy: Admin/system can read and update reports
CREATE POLICY "reports_admin_write" ON public.reports
  FOR ALL
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on profile_verification
CREATE OR REPLACE FUNCTION public.update_profile_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_verification_updated_at
  BEFORE UPDATE ON public.profile_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_verification_updated_at();

-- Trigger: Update profile is_verified flag when verification changes
CREATE OR REPLACE FUNCTION public.sync_profile_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET is_verified = NEW.is_verified,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_profile_verified_status
  AFTER UPDATE ON public.profile_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_verified_status();

-- Trigger: Create notification when profile is verified
CREATE OR REPLACE FUNCTION public.notify_on_profile_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      subtitle
    )
    VALUES (
      NEW.user_id,
      'profile_verified'::notification_type_enum,
      'Profile verified!',
      'Your profile has been verified and now displays a badge'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_profile_verified
  AFTER UPDATE ON public.profile_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_profile_verified();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get report count for a user (for profile health check)
CREATE OR REPLACE FUNCTION public.get_user_report_count(user_id_param UUID)
RETURNS TABLE (
  total_reports INTEGER,
  open_reports INTEGER,
  resolved_reports INTEGER
) AS $$
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status IN ('open', 'under_review'))::INTEGER,
    COUNT(*) FILTER (WHERE status = 'resolved')::INTEGER
  FROM public.reports
  WHERE reported_user_id = user_id_param;
$$ LANGUAGE sql STABLE;

-- Function: Check if user has critical reports (for automated suppression)
CREATE OR REPLACE FUNCTION public.has_critical_reports(user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reports
    WHERE reported_user_id = user_id_param
      AND status = 'resolved'
      AND report_type IN ('fake_profile', 'scam')
      AND resolved_at > CURRENT_TIMESTAMP - INTERVAL '90 days'
  );
$$ LANGUAGE sql STABLE;

-- Function: Flag profile for recheck
CREATE OR REPLACE FUNCTION public.flag_profile_for_recheck(user_id_param UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profile_verification
  SET 
    needs_recheck = TRUE,
    recheck_requested_at = CURRENT_TIMESTAMP,
    verification_notes = COALESCE(verification_notes || E'\n', '') || 'Recheck requested: ' || COALESCE(reason, 'Admin review')
  WHERE user_id = user_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.profile_verification TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_report_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_critical_reports(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.flag_profile_for_recheck(UUID, TEXT) TO authenticated;
