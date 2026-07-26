-- Migration 022: Push notification token storage
-- Purpose: store Expo push tokens per device so a future delivery worker (an
-- Edge Function or server job) can send remote pushes for the events the
-- notify_on_* triggers (migration 005) already write to public.notifications.
-- This migration only adds storage - it does not send anything by itself.

CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_type TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_unique_pair UNIQUE (user_id, expo_push_token)
);

CREATE INDEX push_tokens_user_id_idx ON public.push_tokens (user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own_all" ON public.push_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
