-- Migration 036: Revoke excess default anon grants on messages/notifications/matches
--
-- RLS on all three tables keys every policy off auth.uid(), which is NULL
-- for anon requests, so anon was already denied in practice - this is not a
-- live exploit. But Supabase's default ACL had never revoked anon's default
-- full CRUD grant on these tables (only authenticated was tightened, in
-- migrations 029/030), and today's work added messages/notifications to the
-- supabase_realtime publication (033) and built a new feature on top of the
-- messaging path - widening what depends on these tables being locked down
-- is a good time to close the same gap here, matching the belt-and-suspenders
-- pattern already used for contact_requests/matches/notifications elsewhere.

REVOKE INSERT, UPDATE, DELETE ON public.messages FROM anon;
REVOKE SELECT ON public.messages FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon;
REVOKE SELECT ON public.notifications FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.matches FROM anon;
REVOKE SELECT ON public.matches FROM anon;
