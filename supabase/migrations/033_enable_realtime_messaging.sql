-- Migration 033: Actually enable Realtime broadcast for messages/notifications
--
-- subscribeToMessages() and subscribeToNotifications() (database.ts) have
-- been calling supabase.channel(...).on('postgres_changes', ...) since
-- migration 004/005, but the supabase_realtime publication had zero tables
-- in it - postgres_changes has nothing to broadcast without a table being
-- part of that publication, so both subscriptions were silently inert (the
-- UI only ever updated via the manual getMessages()/useFocusEffect refetch,
-- never a live push). RLS on both tables already restricts each row to its
-- participants (messages_conversation_read / notifications' own-row read),
-- so adding them to the publication doesn't broadcast anything a client
-- couldn't already read via a normal SELECT.

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
