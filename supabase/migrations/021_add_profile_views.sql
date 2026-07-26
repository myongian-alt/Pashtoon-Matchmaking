-- Migration 021: Profile view tracking ("Who Viewed Me")
-- Tracks the most recent time each user viewed another user's profile detail
-- page. One row per (viewer, viewed) pair - repeat views just bump viewed_at
-- rather than growing the table unbounded.

CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_views_no_self_view CHECK (viewer_id <> viewed_user_id),
  CONSTRAINT profile_views_unique_pair UNIQUE (viewer_id, viewed_user_id)
);

CREATE INDEX profile_views_viewed_user_idx ON public.profile_views (viewed_user_id, viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- A user can only log views performed by themselves.
CREATE POLICY "profile_views_insert_own" ON public.profile_views
  FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "profile_views_update_own" ON public.profile_views
  FOR UPDATE
  USING (viewer_id = auth.uid())
  WITH CHECK (viewer_id = auth.uid());

-- A user can see who viewed their own profile, excluding anyone they've
-- blocked or who has blocked them (mirrors the discovery visibility rules
-- added in migration 018).
CREATE POLICY "profile_views_read_received" ON public.profile_views
  FOR SELECT
  USING (
    viewed_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profile_views.viewer_id)
         OR (b.blocker_id = profile_views.viewer_id AND b.blocked_id = auth.uid())
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.profile_views TO authenticated;
