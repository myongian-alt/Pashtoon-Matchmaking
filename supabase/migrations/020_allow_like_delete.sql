-- Migration 020: Allow removing a like/shortlist
-- Purpose: migration 003 only granted SELECT/INSERT/UPDATE on likes, so there
-- was no way to un-favorite/un-shortlist a profile (only add or change the
-- action). The existing "likes_own_write" RLS policy is FOR ALL and already
-- covers DELETE for a user's own rows - it just needed the grant.

GRANT DELETE ON public.likes TO authenticated;
