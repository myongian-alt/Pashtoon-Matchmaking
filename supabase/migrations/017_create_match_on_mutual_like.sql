-- Migration 017: Auto-create a match when two users mutually like each other
-- Purpose: the `matches` table (and everything downstream of it -
-- conversations auto-created by migration 004's trigger, notifications by
-- migration 005's trigger) had no code path that ever inserted a row into it.
-- getMatches() only reads; nothing writes. This closes the loop: like ->
-- (if reciprocated) match -> conversation -> notification, all automatic.

CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS trigger_create_match_on_mutual_like ON public.likes;
CREATE TRIGGER trigger_create_match_on_mutual_like
  AFTER INSERT OR UPDATE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();
