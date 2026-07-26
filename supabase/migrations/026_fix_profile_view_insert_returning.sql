-- Migration 026: Fix trackProfileView() silently failing on every call
--
-- profile_views_read_received (migration 021) only allows the VIEWED user to
-- SELECT a row: (viewed_user_id = auth.uid()). PostgREST's default Prefer
-- header for insert/upsert is `return=representation` (confirmed against the
-- live project - the client never overrides it), which means every insert
-- runs as `INSERT ... RETURNING *`. Postgres enforces the table's SELECT
-- policy against that RETURNING row, not just the INSERT policy's WITH
-- CHECK - and the person doing the inserting (the viewer) never satisfies
-- viewed_user_id = auth.uid() for their own insert. Every call to
-- trackProfileView() has therefore failed with a row-security error since
-- migration 021 shipped, and "Who Viewed Me" has never recorded a single
-- real view.
--
-- Let a viewer also read back the rows they created themselves.

DROP POLICY IF EXISTS "profile_views_read_received" ON public.profile_views;

CREATE POLICY "profile_views_read_received" ON public.profile_views
  FOR SELECT
  USING (
    viewer_id = auth.uid()
    OR (
      viewed_user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profile_views.viewer_id)
           OR (b.blocker_id = profile_views.viewer_id AND b.blocked_id = auth.uid())
      )
    )
  );
