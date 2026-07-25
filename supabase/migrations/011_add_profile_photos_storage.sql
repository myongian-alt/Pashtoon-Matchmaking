-- Migration 011: Storage bucket for profile photos + gallery slot cap fix
-- Purpose: the app picks profile/gallery photos with expo-image-picker but never
-- uploads them anywhere - they only ever exist as local file:// URIs on-device,
-- and profile_photos never gets a row. This adds the missing Storage bucket and
-- object-level RLS so uploads actually persist and are visible to other users.

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public read: photos need to be visible to other users during discovery.
CREATE POLICY "profile_photos_bucket_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Owner-only write: object path is expected to be "<user_id>/<filename>",
-- so the first path segment must match the authenticated user.
CREATE POLICY "profile_photos_bucket_owner_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_bucket_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_bucket_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- GALLERY SLOT CAP
-- ============================================================================
-- The profile form UI (ProfileFormScreen) allows 5 gallery photos, but the
-- original display_order_limit constraint only allowed up to 4 (display_order
-- 0 reserved for the main profile picture, 1-4 for gallery). Raise the cap so
-- the 5th gallery slot the UI already exposes can actually be saved.

ALTER TABLE public.profile_photos DROP CONSTRAINT IF EXISTS display_order_limit;
ALTER TABLE public.profile_photos ADD CONSTRAINT display_order_limit CHECK (display_order <= 5);
