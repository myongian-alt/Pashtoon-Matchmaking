-- Migration 038: Track completion of the post-signup "basics" screen
-- Purpose: Separate, lighter-weight flag from profile_completed (which tracks
-- the full ~90-field ProfileForm) - this one tracks whether a user has been
-- through the short post-auth basics prompt (name/age/marital status/
-- location/education/profession/height/prayers/smoking/skin tone/income) at
-- least once, so returning users aren't shown it again.

ALTER TABLE public.user_app_state
  ADD COLUMN IF NOT EXISTS basics_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS basics_completed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.user_app_state.basics_completed IS 'True once the user has submitted (or explicitly skipped) the post-signup basics screen.';
