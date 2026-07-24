-- Migration 004: Create messaging tables
-- Purpose: 1:1 conversations and individual messages

-- ============================================================================
-- TABLE: conversations
-- Purpose: 1:1 DM thread container with metadata
-- Linked to: users (N:1 from both sides), matches
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_preview VARCHAR(255),
  last_message_sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  CONSTRAINT cannot_message_self CHECK (user_1_id != user_2_id),
  CONSTRAINT user_1_less_than_user_2 CHECK (user_1_id < user_2_id),
  CONSTRAINT unique_conversation_pair UNIQUE (user_1_id, user_2_id),
  CONSTRAINT last_message_sender_valid CHECK (
    last_message_sender_id IS NULL OR
    last_message_sender_id = user_1_id OR
    last_message_sender_id = user_2_id
  )
);

-- Add comments
COMMENT ON TABLE public.conversations IS 'Chat threads between matched users. Normalized: user_1_id < user_2_id always. Metadata cached for performance.';
COMMENT ON COLUMN public.conversations.last_message_preview IS 'Cached preview of last message for inbox display (avoid JOIN on messages)';

-- Create indexes
CREATE INDEX idx_conversations_user_1_id ON public.conversations(user_1_id);
CREATE INDEX idx_conversations_user_2_id ON public.conversations(user_2_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_conversations_active ON public.conversations(user_1_id, updated_at DESC);

-- ============================================================================
-- TABLE: messages
-- Purpose: Individual messages within conversations
-- Linked to: conversations (N:1), users (N:1 for sender)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message_text)) > 0),
  CONSTRAINT message_length CHECK (LENGTH(message_text) <= 5000),
  CONSTRAINT read_after_created CHECK (read_at IS NULL OR read_at >= created_at),
  CONSTRAINT edited_after_created CHECK (edited_at IS NULL OR edited_at >= created_at)
);

-- Add comments
COMMENT ON TABLE public.messages IS 'Individual messages in conversations. read_at tracks when recipient read the message.';
COMMENT ON COLUMN public.messages.edited_at IS 'Timestamp of last edit (immutable edits, only timestamps updated)';

-- Create indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Partial index for unread messages per conversation
CREATE INDEX idx_messages_conversation_unread ON public.messages(conversation_id)
  WHERE read_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read conversations they're part of
CREATE POLICY "conversations_own_read" ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- RLS Policy: Conversations are created by system/matches only
-- (should not allow direct user inserts, only via trigger)
CREATE POLICY "conversations_system_insert" ON public.conversations
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Can only update metadata of conversations you're in
CREATE POLICY "conversations_own_update" ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id)
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read messages from conversations they're part of
CREATE POLICY "messages_conversation_read" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_1_id = auth.uid() OR c.user_2_id = auth.uid())
    )
  );

-- RLS Policy: Users can only send messages in conversations they're part of
CREATE POLICY "messages_own_send" ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.user_1_id = auth.uid() OR c.user_2_id = auth.uid())
    )
  );

-- RLS Policy: Users can update read_at on messages they received
CREATE POLICY "messages_mark_read" ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          (c.user_1_id = auth.uid() AND sender_id = c.user_2_id) OR
          (c.user_2_id = auth.uid() AND sender_id = c.user_1_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          (c.user_1_id = auth.uid() AND sender_id = c.user_2_id) OR
          (c.user_2_id = auth.uid() AND sender_id = c.user_1_id)
        )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update conversation metadata when new message arrives
CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    updated_at = CURRENT_TIMESTAMP,
    last_message_preview = SUBSTRING(NEW.message_text, 1, 255),
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_new_message();

-- Trigger: Auto-create conversation when match is created
CREATE OR REPLACE FUNCTION public.create_conversation_on_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.conversations (user_1_id, user_2_id)
  VALUES (NEW.user_1_id, NEW.user_2_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_conversation_on_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.create_conversation_on_match();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
