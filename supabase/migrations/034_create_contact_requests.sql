-- Migration 034: Contact detail requests routed to admin (replaces the
-- $30 payment paywall on ProfileDetailScreen's "View Contact Details" button,
-- for now - see request-contact-details Edge Function, which inserts here
-- and emails the admin).

CREATE TABLE public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, target_user_id)
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Requests are only ever written by the request-contact-details Edge
-- Function (service role, bypasses RLS) so a client can't fabricate one
-- for another user or forge the target - this policy only covers the
-- client's own read access to requests it made.
CREATE POLICY "contact_requests_own_read" ON public.contact_requests
  FOR SELECT
  USING (auth.uid() = requester_id);

-- Default Supabase ACLs grant anon full CRUD on any new table regardless of
-- RLS - the missing INSERT/UPDATE/DELETE policies already deny those via
-- RLS, but this revokes the raw grants too rather than relying on RLS alone
-- (same belt-and-suspenders pattern as migrations 029/030/032). anon has no
-- legitimate reason to read this table either - only the requester
-- themselves (via contact_requests_own_read) or the service role should.
REVOKE INSERT, UPDATE, DELETE ON public.contact_requests FROM authenticated, anon;
REVOKE SELECT ON public.contact_requests FROM anon;
