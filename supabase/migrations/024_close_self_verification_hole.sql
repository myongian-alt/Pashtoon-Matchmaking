-- Migration 024: Close a self-verification hole in profile_verification
--
-- profile_verification_own_insert/_own_update (migration 019) were designed
-- to rely on column-level grants - only user_id/verification_requested_at -
-- so a user could request verification but never write is_verified
-- themselves. That assumption was wrong: Supabase grants full table-level
-- INSERT/UPDATE/DELETE to `authenticated` by default on every new table
-- (via ALTER DEFAULT PRIVILEGES on the public schema, applied at table
-- creation time), and that default was never revoked for this table. A
-- table-level grant makes every column writable regardless of any narrower
-- column-level grant sitting alongside it, so any signed-in user could
-- already call `.update({ is_verified: true })` on their own row and pass
-- the profile_verification_own_update RLS check (auth.uid() = user_id).
--
-- Revoke the table-level grants so only the intended column list remains
-- writable by authenticated users.

REVOKE INSERT, UPDATE ON public.profile_verification FROM authenticated;

GRANT INSERT (user_id, verification_requested_at) ON public.profile_verification TO authenticated;
GRANT UPDATE (verification_requested_at) ON public.profile_verification TO authenticated;
