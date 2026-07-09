import { createAdminClient } from '@/lib/supabase/admin';
import { STARTER_PROMPTS } from '@/lib/kunden/starter-prompts';
import type {
  CustomerPrompt,
  CustomerPromptInsert,
  CustomerPromptUpdate,
} from '@/types';
import { PROMPT_VORLAGEN_BUCKET, sanitizeFilenameForPath } from './shared';

// ── Prompt-Vorlagen ──────────────────────────────────────────────────────────

/**
 * Lädt alle Prompt-Vorlagen eines Mandanten.
 *
 * Beim allerersten Zugriff (noch keine Vorlagen) werden die kuratierten
 * Schnellstart-Vorlagen einmalig in die DB übernommen — der Benutzer hat
 * sofort eine sinnvolle Bibliothek. Per UNIQUE-Constraint sind Duplikate
 * ausgeschlossen.
 */
export async function fetchPrompts(companyId: string): Promise<CustomerPrompt[]> {
  const supabase = createAdminClient();

  const fetchSorted = async (): Promise<CustomerPrompt[]> => {
    const { data, error } = await supabase
      .from('customer_prompts')
      .select('*')
      .eq('company', companyId)
      .order('kategorie', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    if (error) throw new Error('Prompt-Vorlagen konnten nicht geladen werden');
    return (data ?? []) as CustomerPrompt[];
  };

  const first = await fetchSorted();
  if (first.length > 0) return first;

  // Erstzugriff: Schnellstart-Bibliothek anlegen (idempotent dank UNIQUE)
  const rows = STARTER_PROMPTS.map((s) => ({
    company: companyId,
    name: s.name,
    beschreibung: s.beschreibung,
    kategorie: s.kategorie,
    template: s.template,
  }));
  await supabase.from('customer_prompts').upsert(rows, { onConflict: 'company,name', ignoreDuplicates: true });
  return fetchSorted();
}

export async function fetchPrompt(id: string, companyId: string): Promise<CustomerPrompt | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_prompts')
    .select('*')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (error) throw new Error('Prompt-Vorlage konnte nicht geladen werden');
  return (data as CustomerPrompt | null) ?? null;
}

export async function createPrompt(
  companyId: string,
  input: CustomerPromptInsert,
): Promise<CustomerPrompt> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_prompts')
    .insert({ ...input, company: companyId })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Eine Vorlage mit diesem Namen existiert bereits');
    }
    throw new Error('Vorlage konnte nicht gespeichert werden');
  }
  return data as CustomerPrompt;
}

export async function updatePrompt(
  id: string,
  companyId: string,
  updates: CustomerPromptUpdate,
): Promise<CustomerPrompt> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_prompts')
    .update(updates)
    .eq('id', id)
    .eq('company', companyId)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Eine Vorlage mit diesem Namen existiert bereits');
    }
    throw new Error('Vorlage konnte nicht aktualisiert werden');
  }
  return data as CustomerPrompt;
}

export async function deletePrompt(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();

  // Vorlage-Datei zuerst ermitteln, dann beides löschen
  const { data: row } = await supabase
    .from('customer_prompts')
    .select('vorlage_dateipfad')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();

  const { error } = await supabase
    .from('customer_prompts')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Vorlage konnte nicht gelöscht werden');

  const pfad = (row as { vorlage_dateipfad: string | null } | null)?.vorlage_dateipfad;
  if (pfad) {
    // Fehler hier ignorieren — DB-Eintrag ist weg, Storage-Aufräumen ist Best-Effort
    await supabase.storage.from(PROMPT_VORLAGEN_BUCKET).remove([pfad]);
  }
}

// ── Vorlage-Datei je Prompt ──────────────────────────────────────────────────

export async function uploadPromptVorlage(
  promptId: string,
  companyId: string,
  file: File,
): Promise<CustomerPrompt> {
  const supabase = createAdminClient();

  // Existenz + Besitz prüfen + alten Pfad merken
  const { data: existing, error: readError } = await supabase
    .from('customer_prompts')
    .select('vorlage_dateipfad')
    .eq('id', promptId)
    .eq('company', companyId)
    .maybeSingle();
  if (readError || !existing) throw new Error('Vorlage nicht gefunden');

  const neuerPfad = `${companyId}/${promptId}/${Date.now()}-${sanitizeFilenameForPath(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await supabase.storage
    .from(PROMPT_VORLAGEN_BUCKET)
    .upload(neuerPfad, buffer, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error('[uploadPromptVorlage] storage upload error', upload.error);
    throw new Error(`Datei konnte nicht hochgeladen werden: ${upload.error.message}`);
  }

  const alt = (existing as { vorlage_dateipfad: string | null }).vorlage_dateipfad;

  const { data, error } = await supabase
    .from('customer_prompts')
    .update({
      vorlage_dateipfad: neuerPfad,
      vorlage_dateiname: file.name,
      vorlage_dateityp: file.type || null,
      vorlage_dateigroesse: file.size,
    })
    .eq('id', promptId)
    .eq('company', companyId)
    .select()
    .single();
  if (error) {
    // Rollback Storage
    await supabase.storage.from(PROMPT_VORLAGEN_BUCKET).remove([neuerPfad]);
    throw new Error('Vorlage-Anhang konnte nicht gespeichert werden');
  }

  // Alte Datei aufräumen (Best-Effort)
  if (alt && alt !== neuerPfad) {
    await supabase.storage.from(PROMPT_VORLAGEN_BUCKET).remove([alt]);
  }

  return data as CustomerPrompt;
}

export async function removePromptVorlage(
  promptId: string,
  companyId: string,
): Promise<CustomerPrompt> {
  const supabase = createAdminClient();

  const { data: existing, error: readError } = await supabase
    .from('customer_prompts')
    .select('vorlage_dateipfad')
    .eq('id', promptId)
    .eq('company', companyId)
    .maybeSingle();
  if (readError || !existing) throw new Error('Vorlage nicht gefunden');

  const alt = (existing as { vorlage_dateipfad: string | null }).vorlage_dateipfad;

  const { data, error } = await supabase
    .from('customer_prompts')
    .update({
      vorlage_dateipfad: null,
      vorlage_dateiname: null,
      vorlage_dateityp: null,
      vorlage_dateigroesse: null,
    })
    .eq('id', promptId)
    .eq('company', companyId)
    .select()
    .single();
  if (error) throw new Error('Anhang konnte nicht entfernt werden');

  if (alt) {
    await supabase.storage.from(PROMPT_VORLAGEN_BUCKET).remove([alt]);
  }
  return data as CustomerPrompt;
}

export async function getPromptVorlageDownloadUrl(
  promptId: string,
  companyId: string,
): Promise<string> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from('customer_prompts')
    .select('vorlage_dateipfad')
    .eq('id', promptId)
    .eq('company', companyId)
    .maybeSingle();
  if (error || !row) throw new Error('Vorlage nicht gefunden');
  const pfad = (row as { vorlage_dateipfad: string | null }).vorlage_dateipfad;
  if (!pfad) throw new Error('Diese Vorlage hat keine Datei');

  const { data: signed, error: signError } = await supabase.storage
    .from(PROMPT_VORLAGEN_BUCKET)
    .createSignedUrl(pfad, 3600);
  if (signError || !signed?.signedUrl) {
    throw new Error('Download-Link konnte nicht erstellt werden');
  }
  return signed.signedUrl;
}
