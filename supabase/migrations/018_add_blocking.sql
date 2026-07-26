-- Migration 018: User blocking
-- Purpose: there was no way for a user to stop seeing someone, beyond the
-- in-memory-only "Skip" in Discovery (which reappeared on reload). Adds a
-- real blocked_users table and bakes the block check into the profiles/
-- profile_photos visibility policies directly, so a blocked pair becomes
-- mutually invisible without either party needing read access to
-- blocked_users itself - the blocked user is never able to tell they were
-- blocked, which matters for harassment situations.

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT cannot_block_self CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block_per_pair UNIQUE (blocker_id, blocked_id)
);

COMMENT ON TABLE public.blocked_users IS 'One-directional blocks. Visibility exclusion is applied to both directions in profiles/profile_photos RLS regardless.';

CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage blocks they themselves created (not who blocked them).
CREATE POLICY "blocked_users_own_read" ON public.blocked_users
  FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocked_users_own_insert" ON public.blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocked_users_own_delete" ON public.blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);

GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;

-- Bake blocking into discovery/profile visibility (both directions).
DROP POLICY IF EXISTS "profiles_active_users_public" ON public.profiles;
CREATE POLICY "profiles_active_users_public" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = profiles.user_id AND u.is_active = TRUE
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profiles.user_id)
         OR (b.blocker_id = profiles.user_id AND b.blocked_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "profile_photos_active_users_public" ON public.profile_photos;
CREATE POLICY "profile_photos_active_users_public" ON public.profile_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = profile_photos.user_id AND u.is_active = TRUE
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profile_photos.user_id)
         OR (b.blocker_id = profile_photos.user_id AND b.blocked_id = auth.uid())
    )
  );
