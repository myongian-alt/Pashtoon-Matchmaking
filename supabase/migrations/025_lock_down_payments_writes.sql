-- Migration 025: Payments/subscriptions must only be written via process_payment()
--
-- Migration 023 added row-owner RLS (auth.uid() = user_id) plus table grants
-- so authenticated users could insert their own payment/subscription rows.
-- That's still too permissive: a user could bypass the app entirely and call
-- the REST API directly to insert a payments row with status='completed'
-- and any amount, then insert a subscriptions row with status='active' and
-- any expires_at - referencing that row (or, since subscriptions.payment_id
-- only requires the payment to exist, even someone else's payment row) - and
-- grant themselves free premium with no real transaction ever happening.
--
-- The intended write path is exclusively the process_payment() RPC. Revoke
-- direct client INSERT/UPDATE and make the function SECURITY DEFINER (with a
-- pinned search_path, the standard guard against search_path hijacking) so
-- it can still write through RLS, while checking auth.uid() itself so a
-- caller can only ever process a payment for their own user id.

REVOKE INSERT, UPDATE ON public.payments FROM authenticated;
REVOKE INSERT, UPDATE ON public.subscriptions FROM authenticated;

CREATE OR REPLACE FUNCTION public.process_payment(
  user_id_param UUID,
  amount_usd_param DECIMAL,
  payment_method_param payment_method_enum,
  transaction_id_param VARCHAR
)
RETURNS TABLE (payment_id UUID, subscription_id UUID)
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_id UUID;
  v_subscription_id UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'not authorized to process a payment for this user';
  END IF;

  INSERT INTO public.payments (
    user_id,
    amount_usd,
    payment_method,
    payment_gateway,
    transaction_id,
    status,
    completed_at
  )
  VALUES (
    user_id_param,
    amount_usd_param,
    payment_method_param,
    CASE payment_method_param
      WHEN 'card' THEN 'stripe'::payment_gateway_enum
      WHEN 'bank_transfer' THEN 'manual'::payment_gateway_enum
      WHEN 'admin_contact' THEN 'admin_override'::payment_gateway_enum
      WHEN 'test' THEN 'stripe'::payment_gateway_enum
    END,
    transaction_id_param,
    'completed'::payment_status_enum,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_payment_id;

  INSERT INTO public.subscriptions (
    user_id,
    payment_id,
    subscription_type,
    status,
    expires_at
  )
  VALUES (
    user_id_param,
    v_payment_id,
    'premium_one_time'::subscription_type_enum,
    'active'::subscription_status_enum,
    CURRENT_TIMESTAMP + INTERVAL '365 days'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    payment_id = v_payment_id,
    status = 'active'::subscription_status_enum,
    expires_at = CURRENT_TIMESTAMP + INTERVAL '365 days',
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    subtitle
  )
  VALUES (
    user_id_param,
    'payment_success'::notification_type_enum,
    'Payment successful!',
    CASE
      WHEN payment_method_param = 'admin_contact' THEN 'Your request was received. Our admin team will contact you soon.'
      ELSE 'Your premium membership is now active.'
    END
  );

  RETURN QUERY SELECT v_payment_id, v_subscription_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.process_payment(UUID, DECIMAL, payment_method_enum, VARCHAR) TO authenticated;
