import { supabase } from './supabase';

const PROFILE_PHOTOS_BUCKET = 'profile-photos';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB - generous for a quality:0.85 picker export

export type UploadPhotoType = 'profile_picture' | 'gallery';

function extensionFromUri(uri: string): string {
  const withoutQuery = uri.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(withoutQuery);
  const ext = (match?.[1] || 'jpg').toLowerCase();
  return ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext;
}

function contentTypeForExtension(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

// Security audit finding #8.1: contentType was previously derived purely
// from the filename extension with nothing checking the actual bytes match.
// Verify the file signature ("magic bytes") for the three formats this app
// ever uploads (the picker is restricted to mediaTypes: Images) instead of
// trusting the name.
const MAGIC_BYTES: Record<string, number[][]> = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // 'RIFF'; WEBP marker follows at byte 8, RIFF prefix is enough to distinguish from jpg/png
};

function matchesMagicBytes(bytes: Uint8Array, extension: string): boolean {
  const candidates = MAGIC_BYTES[extension];
  if (!candidates) {
    return false;
  }
  return candidates.some((signature) => signature.every((byte, index) => bytes[index] === byte));
}

/**
 * Uploads a locally-picked photo (file:// URI from expo-image-picker) to the
 * profile-photos Storage bucket and returns a public URL. Requires migration
 * 011 (bucket + owner-write RLS) to be applied.
 */
export async function uploadProfilePhotoAsset(
  userId: string,
  localUri: string,
  photoType: UploadPhotoType,
  slotIndex: number
) {
  try {
    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_UPLOAD_BYTES) {
      return { publicUrl: null, error: new Error('Photo is too large (max 8MB). Please choose a smaller photo.') };
    }

    const extension = extensionFromUri(localUri);
    if (!matchesMagicBytes(new Uint8Array(arrayBuffer), extension)) {
      return { publicUrl: null, error: new Error('This file does not look like a valid image.') };
    }

    const path = `${userId}/${photoType}-${slotIndex}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: contentTypeForExtension(extension),
        upsert: true,
      });

    if (uploadError) {
      return { publicUrl: null, error: uploadError };
    }

    const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);

    // Cache-bust so the same overwritten path shows the new image immediately.
    return { publicUrl: `${data.publicUrl}?v=${Date.now()}`, error: null };
  } catch (error) {
    return { publicUrl: null, error: error as Error };
  }
}

export function isUploadedPhotoUrl(value: unknown): value is string {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}
