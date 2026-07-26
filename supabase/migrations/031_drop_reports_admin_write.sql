-- Migration 031: Remove the reports_admin_write hole
--
-- Security audit finding #3 (MEDIUM): reports_admin_write (migration 007)
-- is FOR ALL WITH CHECK (true), apparently meant for an admin dashboard -
-- but service_role already bypasses RLS entirely for genuine admin
-- operations and never needed this policy. It only ever granted
-- `authenticated` unrestricted INSERT/UPDATE/DELETE on every report row,
-- combining via OR with the narrower reports_own_write policy and defeating
-- it. Proven live: a user can insert a report with `reported_by` set to an
-- arbitrary other user (impersonating who filed it), and the same open
-- policy would let any user update/delete any existing report - including
-- clearing a real report filed against themselves.
--
-- reports_own_write/_own_read/_target_read already cover every legitimate
-- end-user case (submit a report as yourself, read your own submitted
-- reports, read reports filed against you). Just drop the hole.

DROP POLICY IF EXISTS "reports_admin_write" ON public.reports;
