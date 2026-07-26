-- Migration 030: Notifications must only be created by their notify_on_* triggers
--
-- Security audit finding #2 (HIGH): notifications_system_insert (migration
-- 005) is WITH CHECK (true), same root cause as migration 029's matches
-- fix. Proven live: any authenticated user can insert an arbitrary
-- notification into ANY other user's feed - any user_id, any title/subtitle
-- text, any notification_type including 'system' (indistinguishable in the
-- UI from a real system message). This is a ready-made phishing/social-
-- engineering delivery mechanism at the scale of every user in the app.
--
-- Fix: make every notify_on_* trigger function SECURITY DEFINER (pinned
-- search_path) so they keep working after the direct-client INSERT grant is
-- revoked. own_read/own_update/own_delete are untouched - users still fully
-- manage their own notifications (mark read, delete) same as before.

CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION public.notify_on_connection_accepted()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
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

CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
    NEW.user_1_id,
    NEW.user_2_id,
    'match'::notification_type_enum,
    'New match!',
    'You have a new match',
    NEW.id
  );

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

CREATE OR REPLACE FUNCTION public.notify_on_payment_success()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      subtitle
    )
    VALUES (
      NEW.user_id,
      'payment_success'::notification_type_enum,
      'Payment successful!',
      'Your premium membership is now active. Our admin team will contact you soon.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.notify_on_payment_failed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      subtitle
    )
    VALUES (
      NEW.user_id,
      'payment_failed'::notification_type_enum,
      'Payment failed',
      'There was an issue processing your payment. Please try again or contact support.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "notifications_system_insert" ON public.notifications;
REVOKE INSERT ON public.notifications FROM authenticated;
