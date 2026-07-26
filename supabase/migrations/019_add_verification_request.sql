-- Migration 019: Let users request verification themselves
-- Purpose: profile_verification only ever had SELECT granted to
-- `authenticated` - nothing could write to it from the client, so there was
-- no way to actually request verification (only read the badge). Adding
-- write access needs care: the existing "profile_verification_admin_write"
-- policy is FOR ALL WITH CHECK (TRUE), which was harmless only because no
-- INSERT/UPDATE grant existed yet - granting one without first removing that
-- policy would let any signed-in user set is_verified=TRUE for themselves
-- (or anyone) directly, bypassing verification entirely. Replace it with a
-- narrow self-service policy, and use column-level grants so users can only
-- ever write verification_requested_at - never is_verified/verified_by_admin_id/etc.

ALTER TABLE public.profile_verification
  ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP WITH TIME ZONE;

DROP POLICY IF EXISTS "profile_verification_admin_write" ON public.profile_verification;

CREATE POLICY "profile_verification_own_insert" ON public.profile_verification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_verification_own_update" ON public.profile_verification
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT INSERT (user_id, verification_requested_at) ON public.profile_verification TO authenticated;
GRANT UPDATE (verification_requested_at) ON public.profile_verification TO authenticated;
