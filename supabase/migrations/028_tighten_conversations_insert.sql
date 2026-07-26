-- Migration 028: Tighten conversations INSERT + let premium members message directly
--
-- conversations_system_insert (migration 004) is WITH CHECK (true) - any
-- authenticated user could insert a conversations row between two ARBITRARY
-- other users, not just themselves. It was only ever exercised by the
-- create_conversation_on_match trigger, which runs as the inserting user in
-- the mutual-like path, so this was never caught. getOrCreateConversation()
-- (database.ts) now also inserts directly from the client for the new
-- "Send Message" flow on ProfileDetailScreen, so this needs to be a real
-- check, not a placeholder.

DROP POLICY IF EXISTS "conversations_system_insert" ON public.conversations;
CREATE POLICY "conversations_own_insert" ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);
