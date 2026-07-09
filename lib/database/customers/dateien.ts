import { createAdminClient } from '@/lib/supabase/admin';
import type { CustomerDatei } from '@/types';
import { STORAGE_BUCKET, sanitizeFilenameForPath } from './shared';

// ── Dateien ──────────────────────────────────────────────────────────────────

export async function fetchDateien(
  customerId: string,
  companyId: string,
): Promise<CustomerDatei[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_dateien')
    .select('*')
    .eq('customer_id', customerId)
    .eq('company', companyId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Dateien konnten nicht geladen werden');
  return (data ?? []) as CustomerDatei[];
}

export async function uploadDatei(
  customerId: string,
  companyId: string,
  file: File,
): Promise<CustomerDatei> {
  const supabase = createAdminClient();
  const dateipfad = `${companyId}/${customerId}/${Date.now()}-${sanitizeFilenameForPath(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(dateipfad, buffer, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error('[uploadDatei] storage upload error', upload.error);
    throw new Error(`Datei konnte nicht hochgeladen werden: ${upload.error.message}`);
  }

  const { data, error } = await supabase
    .from('customer_dateien')
    .insert({
      customer_id: customerId,
      company: companyId,
      dateiname: file.name,
      dateipfad,
      dateityp: file.type || null,
      dateigroesse: file.size,
    })
    .select()
    .single();
  if (error) {
    // Storage zurückrollen, wenn DB-Eintrag fehlschlägt
    await supabase.storage.from(STORAGE_BUCKET).remove([dateipfad]);
    throw new Error('Datei-Eintrag konnte nicht gespeichert werden');
  }
  return data as CustomerDatei;
}

export async function deleteDatei(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: row, error: readError } = await supabase
    .from('customer_dateien')
    .select('dateipfad')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (readError) throw new Error('Datei konnte nicht gelesen werden');
  if (!row) return;

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([(row as { dateipfad: string }).dateipfad]);
  if (storageError) throw new Error('Datei konnte nicht aus dem Speicher entfernt werden');

  const { error: dbError } = await supabase
    .from('customer_dateien')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (dbError) throw new Error('Datei-Eintrag konnte nicht gelöscht werden');
}

export async function getDateiDownloadUrl(
  id: string,
  companyId: string,
): Promise<string> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from('customer_dateien')
    .select('dateipfad')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (error || !row) throw new Error('Datei nicht gefunden');

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl((row as { dateipfad: string }).dateipfad, 3600);
  if (signError || !signed?.signedUrl) {
    throw new Error('Download-Link konnte nicht erstellt werden');
  }
  return signed.signedUrl;
}
