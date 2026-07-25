-- Migration 012: Add notifications_enabled to user_app_state
-- Purpose: back the Account tab's notification toggle with a real stored
-- preference. Note: this only stores a preference flag - there is no push
-- notification delivery infrastructure (APNs/FCM/Expo push tokens) in this
-- app yet, so it does not itself suppress or enable any real push sends.

ALTER TABLE public.user_app_state
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.user_app_state.notifications_enabled IS 'User preference only - no push delivery system reads this yet.';
