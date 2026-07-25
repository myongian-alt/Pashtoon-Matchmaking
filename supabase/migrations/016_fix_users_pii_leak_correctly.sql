-- Migration 016: Correct fix for the users PII leak (015 broke signups)
-- Purpose: migration 015 tried to close the email/phone leak via column-level
-- GRANT restriction, but that broke ensureCurrentUserRecord's upsert - Postgres's
-- INSERT ... ON CONFLICT DO UPDATE requires table-level SELECT privilege to
-- evaluate the conflict/update, which a column-restricted grant excluding
-- email/phone can't satisfy even for the row's own owner. Confirmed live:
-- every first-time profile save started failing with 403 "permission denied
-- for table users" immediately after 015 was deployed.
--
-- The correct fix tightens RLS instead of grants: public.users' SELECT policy
-- now only ever allows a user to see their own row, full stop. The one
-- legitimate cross-user need (discovery/matching needs to read *other* users'
-- gender_preference) is served by a separate view exposing only non-sensitive
-- columns, never email/phone.

-- Restore full table-level SELECT so ON CONFLICT DO UPDATE works for a user's
-- own row again.
GRANT SELECT ON public.users TO authenticated;

-- Tighten row visibility: only ever your own row, through this table.
DROP POLICY IF EXISTS "users_own_profile_visible" ON public.users;
CREATE POLICY "users_own_profile_visible" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Narrow, PII-free view for the legitimate cross-user read (discovery/matching
-- filtering by gender_preference). Created with default (definer) semantics
-- so its WHERE clause evaluates against the whole table regardless of the
-- querying user's own RLS-limited view of public.users.
CREATE OR REPLACE VIEW public.users_public AS
  SELECT id, gender_preference, is_active
  FROM public.users
  WHERE is_active = TRUE;

GRANT SELECT ON public.users_public TO authenticated;
