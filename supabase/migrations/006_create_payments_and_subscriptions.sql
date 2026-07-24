-- Migration 006: Create payments and subscriptions tables
-- Purpose: Financial transactions and premium membership tracking

-- Create ENUM types
CREATE TYPE payment_method_enum AS ENUM ('card', 'bank_transfer', 'admin_contact', 'test');
CREATE TYPE payment_gateway_enum AS ENUM ('stripe', 'manual', 'admin_override');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_type_enum AS ENUM ('premium_one_time', 'premium_monthly');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'expired', 'cancelled');

-- ============================================================================
-- TABLE: payments
-- Purpose: Immutable payment transaction history for audit & reconciliation
-- Linked to: users (N:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10, 2) NOT NULL,
  payment_method payment_method_enum NOT NULL,
  payment_gateway payment_gateway_enum NOT NULL,
  transaction_id VARCHAR(255),
  status payment_status_enum NOT NULL DEFAULT 'pending',
  currency VARCHAR(3) DEFAULT 'USD',
  failed_reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT amount_positive CHECK (amount_usd > 0),
  CONSTRAINT completed_after_created CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Add comments
COMMENT ON TABLE public.payments IS 'Immutable payment records for audit trail and reconciliation. One per transaction.';
COMMENT ON COLUMN public.payments.transaction_id IS 'Reference from payment gateway (stripe charge ID, bank reference, etc.)';
COMMENT ON COLUMN public.payments.amount_usd IS 'Always stored in USD for reporting. Can accept PKR, convert to USD, store here.';

-- Create indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX idx_payments_gateway ON public.payments(payment_gateway);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================================================
-- TABLE: subscriptions
-- Purpose: Active premium membership status (mutable, linked to payments)
-- Linked to: users (N:1, UNIQUE active), payments (N:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  subscription_type subscription_type_enum NOT NULL,
  status subscription_status_enum NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT expires_after_started CHECK (expires_at > started_at)
);

-- Add comments
COMMENT ON TABLE public.subscriptions IS 'Active membership status per user. One per user. Tracks expiration for feature gating (contact details, messaging).';
COMMENT ON COLUMN public.subscriptions.status IS 'active = can access premium, expired = no access, cancelled = manually disabled';
COMMENT ON COLUMN public.subscriptions.payment_id IS 'FK to payment that created this subscription (immutable)';

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_subscriptions_active_check ON public.subscriptions(user_id, status, expires_at)
  WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own payment history
CREATE POLICY "payments_own_read" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/backend can insert payments
CREATE POLICY "payments_system_insert" ON public.payments
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: System/backend can update payments (mark complete/failed)
CREATE POLICY "payments_system_update" ON public.payments
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own subscription
CREATE POLICY "subscriptions_own_read" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/backend can insert/update subscriptions
CREATE POLICY "subscriptions_system_write" ON public.subscriptions
  FOR ALL
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on subscriptions
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- Trigger: Create notification when payment succeeds
CREATE OR REPLACE FUNCTION public.notify_on_payment_success()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER trigger_notify_on_payment_success
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_payment_success();

-- Trigger: Create notification when payment fails
CREATE OR REPLACE FUNCTION public.notify_on_payment_failed()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER trigger_notify_on_payment_failed
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_payment_failed();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if user is active premium member
CREATE OR REPLACE FUNCTION public.is_user_premium(user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.subscriptions
      WHERE user_id = user_id_param
        AND status = 'active'
        AND expires_at > CURRENT_TIMESTAMP
    ),
    FALSE
  );
$$ LANGUAGE sql STABLE;

-- Function: Get user's subscription expiry date
CREATE OR REPLACE FUNCTION public.get_subscription_expiry(user_id_param UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
  SELECT expires_at
  FROM public.subscriptions
  WHERE user_id = user_id_param
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function: Create payment and subscription (transactional)
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
  -- Insert payment record
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

  -- Insert or update subscription
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

  RETURN QUERY SELECT v_payment_id, v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_premium(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_expiry(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment(UUID, DECIMAL, payment_method_enum, VARCHAR) TO authenticated;
