-- Migration 037: Revoke excess default anon grants on every remaining table
--
-- Migration 036 closed this for messages/notifications/matches as pure
-- defense-in-depth, reasoning that RLS on those tables keys everything off
-- auth.uid() (NULL for anon), so anon was already denied in practice.
--
-- That reasoning does NOT hold for profiles/profile_photos: both have a
-- SELECT policy with no auth.uid() check at all
-- (profiles_verified_public: `is_verified = true`) and another whose
-- blocked_users subquery also silently passes for anon (comparing
-- auth.uid() to NULL never matches a real block, so the NOT EXISTS clause
-- is satisfied regardless). Combined with the untouched default anon grant,
-- this was a LIVE, confirmed exploit - verified directly with a plain HTTP
-- request to /rest/v1/profiles using only the public anon key, no user
-- session at all, which returned real rows including full_name,
-- current_city, about_me, and real phone_number values. Not a theoretical
-- risk: this closes an active PII leak.
--
-- Every other table below never had this specific no-auth-required SELECT
-- policy shape, so for them this is the same defense-in-depth posture as
-- migration 036 - but closing it for all of them here rather than
-- table-by-table, since the same default-ACL gap applies identically to
-- every table that's ever been created in this project and was never
-- individually audited for it.

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profile_photos FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.users FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.users_public FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.user_preferences FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.user_app_state FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.likes FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.connections FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.conversations FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.payments FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.subscriptions FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profile_verification FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profile_views FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.push_tokens FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.reports FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.ai_user_nudges FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.blocked_users FROM anon;
