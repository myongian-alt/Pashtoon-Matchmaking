-- Migration 023: Fix payments/subscriptions grants + tighten RLS
--
-- Two bugs in migration 006, both in the same area:
--
-- 1. process_payment() is a plain (SECURITY INVOKER) function, so it runs
--    with the calling user's own privileges - but migration 006 only ever
--    granted table-level SELECT on payments/subscriptions to `authenticated`.
--    The INSERTs inside process_payment() have therefore always failed with
--    a permission-denied error for every real user. The entire "$30 one-time
--    premium" flow wired into ProfileCompletionScreen has never been able to
--    complete a payment.
--
-- 2. The existing write policies used WITH CHECK (TRUE) - once the missing
--    grants above are added, that would let any authenticated user insert a
--    "completed" payment/subscription row for ANY other user_id, not just
--    their own (free premium for anyone, forged payment records).
--
-- This migration adds the missing grants and replaces the WITH CHECK (TRUE)
-- policies with owner-only checks, matching how every other user-writable
-- table in this project is scoped.

DROP POLICY IF EXISTS "payments_system_insert" ON public.payments;
CREATE POLICY "payments_own_insert" ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments are an immutable audit trail (see migration 006 comment) - drop
-- the blanket update policy instead of narrowing it. Nothing in the app
-- updates a payment row after insert.
DROP POLICY IF EXISTS "payments_system_update" ON public.payments;

DROP POLICY IF EXISTS "subscriptions_system_write" ON public.subscriptions;
CREATE POLICY "subscriptions_own_insert" ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_own_update" ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT INSERT ON public.payments TO authenticated;
GRANT INSERT, UPDATE ON public.subscriptions TO authenticated;

-- process_payment() inserted payments directly as 'completed', so the
-- notify_on_payment_success trigger (which only fires on an UPDATE into
-- 'completed') never ran for this path. Insert the notification directly
-- instead so users actually see a confirmation.
CREATE OR REPLACE FUNCTION public.process_payment(
  user_id_param UUID,
  amount_usd_param DECIMAL,
  payment_method_param payment_method_enum,
  transaction_id_param VARCHAR
)
RETURNS TABLE (payment_id UUID, subscription_id UUID) AS $$
DECLARE
  v_payment_id UUID;
  v_subscription_id UUID;
BEGIN
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
