-- Migration 035: Normalize empty-string phone/email to NULL on public.users
--
-- Supabase Auth returns '' (not null) for the phone/email a user didn't sign
-- up with, and ensureCurrentUserRecord() (database.ts) was upserting that ''
-- as-is into these UNIQUE columns. The first email-only signup to ever save
-- a profile claimed '' for phone; every email-only user after that got a
-- duplicate-key error on their OWN profile save, since it depends on this
-- upsert succeeding first. Same risk existed for email on phone-only users.
-- The client-side fix (|| null instead of ?? null) stops new bad rows; this
-- cleans up the one that already got written.

UPDATE public.users SET phone = NULL WHERE phone = '';
UPDATE public.users SET email = NULL WHERE email = '';
