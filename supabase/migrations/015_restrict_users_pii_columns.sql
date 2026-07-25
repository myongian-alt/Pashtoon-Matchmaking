-- Migration 015: Stop leaking email/phone to every authenticated user
-- Purpose: users_own_profile_visible (migration 001) allows SELECT on any
-- row where is_active = TRUE, which was intended to let discovery/matches
-- read other users' gender_preference. RLS controls row visibility, not
-- column visibility, so it also exposed email/phone for every active user
-- to any signed-in user - confirmed live: a fresh throwaway account could
-- read another unrelated user's email via a plain REST call. No application
-- code actually needs to read email/phone from this table (the app gets its
-- own from the auth session), so tightening column-level grants closes the
-- leak without touching the RLS policy or any discovery/matching query.

REVOKE SELECT ON public.users FROM authenticated;
GRANT SELECT (id, gender_preference, is_active, created_at, updated_at, last_login) ON public.users TO authenticated;
