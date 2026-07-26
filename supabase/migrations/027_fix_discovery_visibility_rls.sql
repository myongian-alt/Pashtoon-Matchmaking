-- Migration 027: Fix real profiles never showing up in Discover
--
-- profiles_active_users_public and profile_photos_active_users_public
-- (migration 010) both gate visibility on
--   EXISTS (SELECT 1 FROM users u WHERE u.id = <target>.user_id AND u.is_active = true)
-- referencing the raw public.users table directly. Migration 016 (fixing a
-- PII leak) tightened users' own RLS to auth.uid() = id only - which also
-- applies to this EXISTS subquery, since RLS is enforced on every reference
-- to a table regardless of nesting. The subquery can therefore only ever see
-- the CALLER's own users row, so the EXISTS check is FALSE for every other
-- user's profile - real profiles/photos have been invisible to anyone but
-- their own owner ever since, and the only reason Discover looked populated
-- is the client-side fallback sample profiles filling the gap.
--
-- public.users_public already exists precisely to expose is_active (and
-- gender_preference) for other users without exposing PII, and works here
-- because view privileges run as the view owner rather than the querying
-- role. Point both policies at it instead of the locked-down users table.

DROP POLICY IF EXISTS "profiles_active_users_public" ON public.profiles;
CREATE POLICY "profiles_active_users_public" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_public u
      WHERE u.id = profiles.user_id AND u.is_active = true
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
      SELECT 1 FROM public.users_public u
      WHERE u.id = profile_photos.user_id AND u.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profile_photos.user_id)
         OR (b.blocker_id = profile_photos.user_id AND b.blocked_id = auth.uid())
    )
  );
