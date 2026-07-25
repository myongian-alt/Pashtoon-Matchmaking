-- Migration 008: Create user_app_state table
-- Purpose: Persist app-level user state such as profile completion flags

CREATE TABLE IF NOT EXISTS public.user_app_state (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.user_app_state IS 'Per-user app state that does not fit core profile domain tables.';
COMMENT ON COLUMN public.user_app_state.profile_completed IS 'True when the user has submitted profile form completion at least once.';

-- Keep updated_at fresh on writes
DROP TRIGGER IF EXISTS trigger_user_app_state_updated_at ON public.user_app_state;
CREATE TRIGGER trigger_user_app_state_updated_at
  BEFORE UPDATE ON public.user_app_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;

-- Users can only view/update their own app state
DROP POLICY IF EXISTS "user_app_state_own_read" ON public.user_app_state;
CREATE POLICY "user_app_state_own_read" ON public.user_app_state
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_app_state_own_insert" ON public.user_app_state;
CREATE POLICY "user_app_state_own_insert" ON public.user_app_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_app_state_own_update" ON public.user_app_state;
CREATE POLICY "user_app_state_own_update" ON public.user_app_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_app_state TO authenticated;
