import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Normalize URL in case /rest/v1 or trailing slash was included
const supabaseUrl = rawSupabaseUrl
  ? rawSupabaseUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  : undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const CMS_MEDIA_BUCKET = 'cms-media';

/**
 * Converts a compressed image Data URL into a Blob and uploads it to the
 * Supabase Storage `cms-media` bucket. Returns the public HTTPS URL on success,
 * or null if Storage is unavailable / bucket policies reject the upload.
 */
export async function uploadDataUrlToSupabaseStorage(
  dataUrl: string,
  folder = 'uploads'
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !dataUrl.startsWith('data:image/')) {
    return null;
  }
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from(CMS_MEDIA_BUCKET)
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase Storage upload skipped (falling back to inline data URL):', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(CMS_MEDIA_BUCKET)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.warn('Supabase Storage upload error:', err);
    return null;
  }
}
