-- Migration 010: Allow discovery of active profiles, not just admin-verified ones
-- Purpose: profiles_verified_public (migration 002) only exposed profiles where
-- is_verified = TRUE, but verification is a manual admin action (migration 007)
-- that most users never receive. As written, getDiscoveryProfiles() returns no
-- rows for real users and the app silently falls back to hardcoded sample
-- profiles. This adds visibility for any active user's profile so discovery
-- works as intended; is_verified remains a separate "verified badge" concept.

CREATE POLICY "profiles_active_users_public" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = profiles.user_id AND u.is_active = TRUE
    )
  );

CREATE POLICY "profile_photos_active_users_public" ON public.profile_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = profile_photos.user_id AND u.is_active = TRUE
    )
  );
