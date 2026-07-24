-- Migration 003: Create social interaction tables
-- Purpose: Like/reject, connection requests, and matches

-- Create ENUM types
CREATE TYPE like_action_enum AS ENUM ('like', 'reject', 'shortlist');
CREATE TYPE connection_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE match_status_enum AS ENUM ('active', 'inactive', 'blocked');

-- ============================================================================
-- TABLE: likes
-- Purpose: Track all likes, rejections, and shortlists (one-way interactions)
-- Linked to: users (N:1 from both sides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action like_action_enum NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT cannot_like_self CHECK (user_id != liked_user_id),
  CONSTRAINT unique_like_per_pair UNIQUE (user_id, liked_user_id)
);

-- Add comments
COMMENT ON TABLE public.likes IS 'One-way interactions: like, reject, or shortlist. Immutable history of user interactions.';
COMMENT ON COLUMN public.likes.action IS 'like = interested, reject = not interested, shortlist = saved for later';

-- Create indexes
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_liked_user_id ON public.likes(liked_user_id);
CREATE INDEX idx_likes_action ON public.likes(action);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);
CREATE INDEX idx_likes_received ON public.likes(liked_user_id, action) WHERE action = 'like';

-- ============================================================================
-- TABLE: connections
-- Purpose: Interest/connection requests with state (formal two-way handshake)
-- Linked to: users (N:1 from both sides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status connection_status_enum NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),

  CONSTRAINT cannot_request_self CHECK (requester_id != recipient_id),
  CONSTRAINT message_length CHECK (message IS NULL OR LENGTH(message) <= 500),
  CONSTRAINT unique_connection_per_pair UNIQUE (requester_id, recipient_id),
  CONSTRAINT accepted_date_after_created CHECK (accepted_at IS NULL OR accepted_at >= created_at),
  CONSTRAINT rejected_date_after_created CHECK (rejected_at IS NULL OR rejected_at >= created_at)
);

-- Add comments
COMMENT ON TABLE public.connections IS 'Formal interest requests with state tracking. Can be pending, accepted, rejected, or expire.';
COMMENT ON COLUMN public.connections.status IS 'pending = awaiting response, accepted = mutual interest, rejected = declined, expired = auto-expired after 30 days';
COMMENT ON COLUMN public.connections.message IS 'Optional personal note from requester (max 500 chars)';

-- Create indexes
CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_recipient_id ON public.connections(recipient_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_connections_created_at ON public.connections(created_at DESC);
CREATE INDEX idx_connections_expires_at ON public.connections(expires_at);
CREATE INDEX idx_connections_pending_inbox ON public.connections(recipient_id, status) WHERE status = 'pending';
CREATE INDEX idx_connections_mutual ON public.connections(requester_id, status) WHERE status = 'accepted';

-- ============================================================================
-- TABLE: matches
-- Purpose: Confirmed bi-directional matches with compatibility score
-- Linked to: users (N:1 from both sides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0,
  match_algorithm_version INTEGER DEFAULT 1,
  status match_status_enum DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT cannot_match_self CHECK (user_1_id != user_2_id),
  CONSTRAINT user_1_less_than_user_2 CHECK (user_1_id < user_2_id),
  CONSTRAINT match_score_valid CHECK (match_score >= 0 AND match_score <= 100),
  CONSTRAINT unique_match_pair UNIQUE (user_1_id, user_2_id)
);

-- Add comments
COMMENT ON TABLE public.matches IS 'Confirmed bi-directional matches. Controls who can message each other. Normalized: user_1_id < user_2_id always.';
COMMENT ON COLUMN public.matches.match_score IS 'Compatibility score (0-100) from matching algorithm';
COMMENT ON COLUMN public.matches.status IS 'active = ongoing, inactive = archived, blocked = one user blocked the other';

-- Create indexes
CREATE INDEX idx_matches_user_1_id ON public.matches(user_1_id);
CREATE INDEX idx_matches_user_2_id ON public.matches(user_2_id);
CREATE INDEX idx_matches_match_score ON public.matches(match_score DESC);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX idx_matches_active ON public.matches(status) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own likes
CREATE POLICY "likes_own_read" ON public.likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can see who liked them (to show notifications)
CREATE POLICY "likes_received_read" ON public.likes
  FOR SELECT
  USING (auth.uid() = liked_user_id AND action = 'like');

-- RLS Policy: Users can only write their own likes
CREATE POLICY "likes_own_write" ON public.likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read connections they're part of
CREATE POLICY "connections_own_read" ON public.connections
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- RLS Policy: Users can only write connections they initiated
CREATE POLICY "connections_own_write" ON public.connections
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS Policy: Recipients can update status of connections to them
CREATE POLICY "connections_recipient_update" ON public.connections
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Enable RLS on matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read matches they're part of
CREATE POLICY "matches_own_read" ON public.matches
  FOR SELECT
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- RLS Policy: System/backend can write matches (admin operations)
-- Note: In production, would use service role or scheduled function
CREATE POLICY "matches_system_write" ON public.matches
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on matches
CREATE OR REPLACE FUNCTION public.update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_matches_updated_at();

-- Trigger: Auto-accept mutual connections (if both sent requests)
CREATE OR REPLACE FUNCTION public.auto_accept_mutual_connections()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a reverse connection from recipient to requester
  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE requester_id = NEW.recipient_id
      AND recipient_id = NEW.requester_id
      AND status = 'pending'
  ) THEN
    -- Both have requested each other - accept automatically
    UPDATE public.connections
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE requester_id = NEW.recipient_id
      AND recipient_id = NEW.requester_id;
    
    UPDATE public.connections
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_accept_mutual_connections
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_accept_mutual_connections();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.connections TO authenticated;
GRANT SELECT ON public.matches TO authenticated;
