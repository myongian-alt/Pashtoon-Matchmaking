import { supabase } from './supabase';

const PROFILE_PHOTOS_BUCKET = 'profile-photos';

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
    const extension = extensionFromUri(localUri);
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
