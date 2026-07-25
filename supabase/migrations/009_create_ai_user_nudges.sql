-- Migration 009: Create ai_user_nudges table
-- Purpose: Store gentle, contextual AI nudges with strict one-per-day delivery per user

CREATE TABLE IF NOT EXISTS public.ai_user_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nudge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  nudge_type VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  body VARCHAR(280) NOT NULL,
  action_label VARCHAR(60),
  action_route VARCHAR(120),
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ai_nudges_unique_daily UNIQUE (user_id, nudge_date),
  CONSTRAINT ai_nudges_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT ai_nudges_body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

COMMENT ON TABLE public.ai_user_nudges IS 'One gentle AI nudge per user per day to encourage helpful actions without spam.';
COMMENT ON COLUMN public.ai_user_nudges.nudge_type IS 'Examples: profile_quality, discovery_reengage, check_alerts.';

CREATE INDEX idx_ai_user_nudges_user_date ON public.ai_user_nudges(user_id, nudge_date DESC);
CREATE INDEX idx_ai_user_nudges_user_created ON public.ai_user_nudges(user_id, created_at DESC);

ALTER TABLE public.ai_user_nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_user_nudges_own_read" ON public.ai_user_nudges;
CREATE POLICY "ai_user_nudges_own_read" ON public.ai_user_nudges
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_user_nudges_system_insert" ON public.ai_user_nudges;
CREATE POLICY "ai_user_nudges_system_insert" ON public.ai_user_nudges
  FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "ai_user_nudges_own_update" ON public.ai_user_nudges;
CREATE POLICY "ai_user_nudges_own_update" ON public.ai_user_nudges
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.ai_user_nudges TO authenticated;
