-- Migration 029: Matches must only be created by the mutual-like trigger
--
-- Security audit finding #1 (CRITICAL): matches_system_write (migration 003)
-- is WITH CHECK (true) - written assuming only create_match_on_mutual_like()
-- would ever insert here, but that trigger is a plain (non-SECURITY-DEFINER)
-- function, so the policy applies equally to a direct client call, and
-- Supabase's default table-level grants give `authenticated` full INSERT
-- rights regardless of this policy's intent. Proven live: an authenticated
-- user can insert a match row between themselves and anyone else with zero
-- interaction from that other party. Because create_conversation_on_match
-- fires on ANY insert into matches, this also auto-creates a real
-- conversation - unwanted contact, and a free bypass of the premium
-- messaging paywall in one call.
--
-- Fix: make the trigger function SECURITY DEFINER (so it can still write
-- after the direct-client grant is revoked) with a pinned search_path, then
-- lock the table down to trigger-only writes.

CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_1 UUID;
  v_user_2 UUID;
  v_score INTEGER;
BEGIN
  IF NEW.action != 'like' THEN
    RETURN NEW;
  END IF;

  -- Only proceed if the other user has already liked this one back.
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE user_id = NEW.liked_user_id
      AND liked_user_id = NEW.user_id
      AND action = 'like'
  ) THEN
    v_user_1 := LEAST(NEW.user_id, NEW.liked_user_id);
    v_user_2 := GREATEST(NEW.user_id, NEW.liked_user_id);

    SELECT ROUND((
      COALESCE((SELECT profile_strength_percentage FROM public.profiles WHERE user_id = v_user_1), 50) +
      COALESCE((SELECT profile_strength_percentage FROM public.profiles WHERE user_id = v_user_2), 50)
    ) / 2.0) INTO v_score;

    INSERT INTO public.matches (user_1_id, user_2_id, match_score, status)
    VALUES (v_user_1, v_user_2, LEAST(GREATEST(COALESCE(v_score, 50), 0), 100), 'active')
    ON CONFLICT (user_1_id, user_2_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "matches_system_write" ON public.matches;
REVOKE INSERT, UPDATE, DELETE ON public.matches FROM authenticated;
