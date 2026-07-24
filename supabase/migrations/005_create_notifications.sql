-- Migration 005: Create notifications table
-- Purpose: Activity feed and alerts for users

-- Create ENUM type for notification types
CREATE TYPE notification_type_enum AS ENUM (
  'like',
  'connection_request',
  'connection_accepted',
  'message',
  'match',
  'profile_verified',
  'payment_success',
  'payment_failed',
  'subscription_expired',
  'system'
);

-- ============================================================================
-- TABLE: notifications
-- Purpose: User activity feed with various notification types
-- Linked to: users (N:1 from both sides - recipient and source)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notification_type notification_type_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  action_url VARCHAR(500),
  action_object_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),

  CONSTRAINT cannot_notify_self CHECK (user_id != source_user_id OR source_user_id IS NULL),
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Add comments
COMMENT ON TABLE public.notifications IS 'Activity feed. One per event. Auto-expires after 30 days. source_user_id nullable for system notifications.';
COMMENT ON COLUMN public.notifications.action_object_id IS 'ID of related object (connection_id, message_id, etc.) for deeplinks';
COMMENT ON COLUMN public.notifications.expires_at IS 'Auto-cleanup date. Notifications older than 30 days can be deleted.';

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_source_user_id ON public.notifications(source_user_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_unread_count ON public.notifications(user_id, notification_type)
  WHERE read_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own notifications
CREATE POLICY "notifications_own_read" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/backend can insert notifications
CREATE POLICY "notifications_system_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Users can mark their own notifications as read
CREATE POLICY "notifications_own_update" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "notifications_own_delete" ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Create notification when user receives a like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  SELECT
    NEW.liked_user_id,
    NEW.user_id,
    'like'::notification_type_enum,
    'New like received',
    'Someone liked your profile',
    NEW.id
  WHERE NEW.action = 'like';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();

-- Trigger: Create notification when connection request is received
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    NEW.recipient_id,
    NEW.requester_id,
    'connection_request'::notification_type_enum,
    'Connection request received',
    'Someone is interested in connecting',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_connection_request
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_connection_request();

-- Trigger: Create notification when connection is accepted
CREATE OR REPLACE FUNCTION public.notify_on_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (
      user_id,
      source_user_id,
      notification_type,
      title,
      subtitle,
      action_object_id
    )
    VALUES (
      NEW.requester_id,
      NEW.recipient_id,
      'connection_accepted'::notification_type_enum,
      'Connection accepted!',
      'Your interest was accepted',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_connection_accepted
  AFTER UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_connection_accepted();

-- Trigger: Create notification when new message arrives
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Determine recipient (the other user in conversation)
  SELECT CASE
    WHEN user_1_id = NEW.sender_id THEN user_2_id
    ELSE user_1_id
  END INTO v_recipient_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    v_recipient_id,
    NEW.sender_id,
    'message'::notification_type_enum,
    'New message',
    SUBSTRING(NEW.message_text, 1, 100),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- Trigger: Create notification when new match is created
CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user_1
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    NEW.user_1_id,
    NEW.user_2_id,
    'match'::notification_type_enum,
    'New match!',
    'You have a new match',
    NEW.id
  );
  
  -- Notify user_2
  INSERT INTO public.notifications (
    user_id,
    source_user_id,
    notification_type,
    title,
    subtitle,
    action_object_id
  )
  VALUES (
    NEW.user_2_id,
    NEW.user_1_id,
    'match'::notification_type_enum,
    'New match!',
    'You have a new match',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_match();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE user_id = user_id_param
    AND read_at IS NULL
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
$$ LANGUAGE sql STABLE;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = CURRENT_TIMESTAMP
  WHERE user_id = user_id_param
    AND read_at IS NULL;
  
  RETURN FOUND::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(UUID) TO authenticated;
