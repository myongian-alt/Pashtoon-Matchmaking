-- Migration 032: ai_user_nudges INSERT must be scoped to the user's own row
--
-- Security audit finding #4 (LOW): ai_user_nudges_system_insert (migration
-- 009) is WITH CHECK (true). Unlike matches/notifications, nothing in the
-- client (`src/lib/aiCoach.ts`, `database.ts`) or any DB trigger actually
-- writes to this table at all yet - it's unused/not wired up to a feature.
-- There's no legitimate "system" writer to preserve via SECURITY DEFINER
-- here, so just narrow the check to ownership, matching every other
-- own-write table in this project.

DROP POLICY IF EXISTS "ai_user_nudges_system_insert" ON public.ai_user_nudges;
CREATE POLICY "ai_user_nudges_own_insert" ON public.ai_user_nudges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
