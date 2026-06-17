import { createAdminClient } from '@/lib/supabase/admin';
import type { Bild, BildMeta } from '@/types';

const BUCKET = 'bilder';

function sanitizeFilenameForPath(name: string): string {
  return (
    name
      .replace(/ä/gi, 'ae')
      .replace(/ö/gi, 'oe')
      .replace(/ü/gi, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'datei'
  );
}

export interface BilderFilter {
  /** Filter: Bild muss MINDESTENS einen der Firmen-Tags besitzen. */
  firmenTags?: string[];
  /** Volltextsuche in Titel, Beschreibung, Uploader. */
  search?: string;
}

export async function fetchBilder(filter: BilderFilter = {}): Promise<Bild[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('bilder')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.firmenTags && filter.firmenTags.length > 0) {
    query = query.overlaps('firmen_tags', filter.firmenTags);
  }
  if (filter.search) {
    const clean = filter.search.replace(/[%,()\\]/g, ' ').trim();
    if (clean.length > 0) {
      const s = `%${clean}%`;
      query = query.or(
        `titel.ilike.${s},beschreibung.ilike.${s},uploaded_by.ilike.${s},dateiname.ilike.${s}`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error('Bilder konnten nicht geladen werden');
  return (data ?? []) as Bild[];
}

export async function uploadBild(
  uploadedByCompany: string,
  meta: BildMeta,
  file: File,
): Promise<Bild> {
  const supabase = createAdminClient();
  const dateipfad = `${Date.now()}-${sanitizeFilenameForPath(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(dateipfad, buffer, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error('[uploadBild] storage error', upload.error);
    throw new Error(`Bild konnte nicht hochgeladen werden: ${upload.error.message}`);
  }

  const { data, error } = await supabase
    .from('bilder')
    .insert({
      titel: meta.titel ?? null,
      beschreibung: meta.beschreibung ?? null,
      firmen_tags: meta.firmen_tags,
      uploaded_by: meta.uploaded_by,
      uploaded_by_company: uploadedByCompany,
      dateipfad,
      dateiname: file.name,
      dateityp: file.type || null,
      dateigroesse: file.size,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([dateipfad]);
    throw new Error('Bild-Eintrag konnte nicht gespeichert werden');
  }
  return data as Bild;
}

export async function deleteBild(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: row, error: readErr } = await supabase
    .from('bilder')
    .select('dateipfad')
    .eq('id', id)
    .maybeSingle();
  if (readErr) throw new Error('Bild konnte nicht gelesen werden');
  if (!row) return;

  const { error: dbErr } = await supabase.from('bilder').delete().eq('id', id);
  if (dbErr) throw new Error('Bild-Eintrag konnte nicht gelöscht werden');

  await supabase.storage.from(BUCKET).remove([(row as { dateipfad: string }).dateipfad]);
}

/** Liefert die öffentliche, dauerhafte URL eines Bildes (Public-Bucket). */
export function publicBildUrl(dateipfad: string): string {
  const supabase = createAdminClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(dateipfad);
  return data.publicUrl;
}
