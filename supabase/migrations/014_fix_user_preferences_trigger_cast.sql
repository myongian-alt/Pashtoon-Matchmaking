-- Migration 014: Fix create_user_preferences_on_signup enum cast bug
-- Purpose: the CASE expression's 'female'/'male' branches resolve to type
-- text, which Postgres will not implicitly cast to gender_seeking_enum when
-- assigning inside an INSERT built from a CASE expression. Every first-time
-- insert into public.users (i.e. every real signup's first profile-save
-- attempt, via ensureCurrentUserRecord) has been failing with:
--   "column gender_seeking is of type gender_seeking_enum but expression is of type text"
-- since this trigger was introduced in migration 001. Confirmed by driving a
-- real signup through the app end-to-end.

CREATE OR REPLACE FUNCTION public.create_user_preferences_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, gender_seeking)
  VALUES (
    NEW.id,
    (CASE WHEN NEW.gender_preference = 'male' THEN 'female' ELSE 'male' END)::gender_seeking_enum
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
