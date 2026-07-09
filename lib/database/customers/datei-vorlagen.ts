import { createAdminClient } from '@/lib/supabase/admin';
import type { DateiVorlage, DateiVorlageMeta } from '@/types';
import { PROMPT_VORLAGEN_BUCKET, sanitizeFilenameForPath } from './shared';

// ── Datei-Vorlagen-Bibliothek ────────────────────────────────────────────────

export async function fetchDateiVorlagen(companyId: string): Promise<DateiVorlage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('datei_vorlagen')
    .select('*')
    .eq('company', companyId)
    .order('kategorie', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });
  if (error) throw new Error('Datei-Vorlagen konnten nicht geladen werden');
  return (data ?? []) as DateiVorlage[];
}

export async function uploadDateiVorlage(
  companyId: string,
  meta: DateiVorlageMeta,
  file: File,
): Promise<DateiVorlage> {
  const supabase = createAdminClient();
  const dateipfad = `${companyId}/library/${Date.now()}-${sanitizeFilenameForPath(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage
    .from(PROMPT_VORLAGEN_BUCKET)
    .upload(dateipfad, buffer, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error('[uploadDateiVorlage] storage upload error', upload.error);
    throw new Error(`Datei konnte nicht hochgeladen werden: ${upload.error.message}`);
  }

  const { data, error } = await supabase
    .from('datei_vorlagen')
    .insert({
      company: companyId,
      name: meta.name,
      kategorie: meta.kategorie ?? null,
      beschreibung: meta.beschreibung ?? null,
      dateipfad,
      dateiname: file.name,
      dateityp: file.type || null,
      dateigroesse: file.size,
    })
    .select()
    .single();
  if (error) {
    // Storage zurückrollen, wenn DB-Eintrag scheitert
    await supabase.storage.from(PROMPT_VORLAGEN_BUCKET).remove([dateipfad]);
    if (error.code === '23505') {
      throw new Error('Eine Datei-Vorlage mit diesem Namen existiert bereits');
    }
    throw new Error('Datei-Vorlage konnte nicht gespeichert werden');
  }
  return data as DateiVorlage;
}

export async function deleteDateiVorlage(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: row, error: readErr } = await supabase
    .from('datei_vorlagen')
    .select('dateipfad')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (readErr) throw new Error('Datei-Vorlage konnte nicht gelesen werden');
  if (!row) return;

  // Verknüpfungen lösen (ON DELETE SET NULL erledigt das im FK; hier reicht
  // also der DB-Delete + Storage-Aufräumen)
  const { error: dbErr } = await supabase
    .from('datei_vorlagen')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (dbErr) throw new Error('Datei-Vorlage konnte nicht gelöscht werden');

  await supabase.storage
    .from(PROMPT_VORLAGEN_BUCKET)
    .remove([(row as { dateipfad: string }).dateipfad]);
}

export async function getDateiVorlageDownloadUrl(
  id: string,
  companyId: string,
): Promise<string> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from('datei_vorlagen')
    .select('dateipfad')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (error || !row) throw new Error('Datei-Vorlage nicht gefunden');
  const { data: signed, error: signErr } = await supabase.storage
    .from(PROMPT_VORLAGEN_BUCKET)
    .createSignedUrl((row as { dateipfad: string }).dateipfad, 3600);
  if (signErr || !signed?.signedUrl) throw new Error('Download-Link konnte nicht erstellt werden');
  return signed.signedUrl;
}
