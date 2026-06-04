import { createAdminClient } from '@/lib/supabase/admin';
import { STARTER_PROMPTS } from '@/lib/kunden/starter-prompts';
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomerKommentar,
  CustomerDatei,
  CustomerPrompt,
  CustomerPromptInsert,
  CustomerPromptUpdate,
  CustomerPromptRendered,
} from '@/types';

const STORAGE_BUCKET = 'customer-dateien';
const PROMPT_VORLAGEN_BUCKET = 'prompt-vorlagen';

// ── Kunden ────────────────────────────────────────────────────────────────────

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company', companyId)
    .order('firmenname', { ascending: true });
  if (error) throw new Error('Kunden konnten nicht geladen werden');
  return (data ?? []) as Customer[];
}

export async function fetchCustomer(id: string, companyId: string): Promise<Customer | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (error) throw new Error('Kunde konnte nicht geladen werden');
  return (data as Customer | null) ?? null;
}

export async function createCustomer(
  companyId: string,
  input: CustomerInsert,
): Promise<Customer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...input, company: companyId })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ein Kunde mit diesem Firmennamen existiert bereits');
    }
    throw new Error('Kunde konnte nicht angelegt werden');
  }
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  companyId: string,
  updates: CustomerUpdate,
): Promise<Customer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .eq('company', companyId)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ein Kunde mit diesem Firmennamen existiert bereits');
    }
    throw new Error('Kunde konnte nicht aktualisiert werden');
  }
  return data as Customer;
}

export async function deleteCustomer(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Kunde konnte nicht gelöscht werden');
}

// ── Kommentare ───────────────────────────────────────────────────────────────

export async function fetchKommentare(
  customerId: string,
  companyId: string,
): Promise<CustomerKommentar[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_kommentare')
    .select('*')
    .eq('customer_id', customerId)
    .eq('company', companyId)
    .order('created_at', { ascending: true });
  if (error) throw new Error('Kommentare konnten nicht geladen werden');
  return (data ?? []) as CustomerKommentar[];
}

export async function createKommentar(
  customerId: string,
  companyId: string,
  text: string,
): Promise<CustomerKommentar> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_kommentare')
    .insert({ customer_id: customerId, company: companyId, text })
    .select()
    .single();
  if (error) throw new Error('Kommentar konnte nicht gespeichert werden');
  return data as CustomerKommentar;
}

export async function deleteKommentar(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('customer_kommentare')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Kommentar konnte nicht gelöscht werden');
}

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
  const dateipfad = `${companyId}/${customerId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(dateipfad, buffer, { contentType: file.type, upsert: false });
  if (upload.error) throw new Error('Datei konnte nicht hochgeladen werden');

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

  const neuerPfad = `${companyId}/${promptId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await supabase.storage
    .from(PROMPT_VORLAGEN_BUCKET)
    .upload(neuerPfad, buffer, { contentType: file.type, upsert: false });
  if (upload.error) throw new Error('Datei konnte nicht hochgeladen werden');

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

// ── Prompt-Rendering ─────────────────────────────────────────────────────────

/**
 * Füllt eine Prompt-Vorlage mit Kunden-Feldern und Datenkodierungs-Werten.
 *
 * Platzhalter-Syntax:
 *   • {{customer.firmenname}} → Kundenfeld
 *     (zulässig: firmenname, ansprechpartner, email, telefon, adresse, notizen, status)
 *   • {{CODE}}                → Datenkodierung mit code='CODE' → Wert ist `name`
 *
 * Großschreibung egal. Nicht aufgelöste Platzhalter werden in
 * `missing_placeholders` (eindeutig, ohne geschweifte Klammern) zurückgemeldet
 * und im Text durch `<<UNGELÖST: …>>` ersetzt.
 */
export async function renderPrompt(
  promptId: string,
  customerId: string,
  companyId: string,
): Promise<CustomerPromptRendered> {
  const supabase = createAdminClient();

  const [promptRes, customerRes, datenkodierungenRes] = await Promise.all([
    supabase.from('customer_prompts').select('template').eq('id', promptId).eq('company', companyId).maybeSingle(),
    supabase.from('customers').select('*').eq('id', customerId).eq('company', companyId).maybeSingle(),
    supabase.from('datenkodierungen').select('code, name').eq('company', companyId),
  ]);

  if (promptRes.error || !promptRes.data) throw new Error('Vorlage nicht gefunden');
  if (customerRes.error || !customerRes.data) throw new Error('Kunde nicht gefunden');
  if (datenkodierungenRes.error) throw new Error('Datenkodierungen konnten nicht geladen werden');

  const template = (promptRes.data as { template: string }).template;
  const customer = customerRes.data as Customer;
  const datenkodierungen = (datenkodierungenRes.data ?? []) as Array<{ code: string; name: string }>;

  // Datenkodierungs-Map case-insensitiv
  const dkMap = new Map<string, string>();
  for (const row of datenkodierungen) dkMap.set(row.code.toUpperCase(), row.name);

  const customerFields: Record<string, { value: string | null; label: string }> = {
    firmenname:      { value: customer.firmenname,      label: 'Firmenname' },
    ansprechpartner: { value: customer.ansprechpartner, label: 'Ansprechpartner' },
    email:           { value: customer.email,           label: 'E-Mail' },
    telefon:         { value: customer.telefon,         label: 'Telefon' },
    adresse:         { value: customer.adresse,         label: 'Adresse' },
    notizen:         { value: customer.notizen,         label: 'Notizen' },
    status:          { value: customer.status,          label: 'Status' },
  };

  const missing = new Set<string>();
  const rendered = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    if (key.toLowerCase().startsWith('customer.')) {
      const field = key.slice(9).toLowerCase();
      const entry = customerFields[field];
      if (!entry || entry.value == null || entry.value === '') {
        missing.add(key);
        return `[${entry?.label ?? field} fehlt]`;
      }
      return entry.value;
    }
    const value = dkMap.get(key.toUpperCase());
    if (value == null || value === '') {
      missing.add(key);
      return `[${key} fehlt]`;
    }
    return value;
  });

  return { prompt: rendered, missing_placeholders: [...missing] };
}

// ── Lead-Import ──────────────────────────────────────────────────────────────

export interface LeadImportErgebnis {
  created: number;
  /** Übersprungen wegen fehlendem Firmennamen oder bereits vorhanden. */
  skipped: number;
  errors: string[];
}

/**
 * Übernimmt ausgewählte Leads als Kunden. Mappt:
 *   firmenname      ← leads.firma
 *   ansprechpartner ← „vorname nachname"
 *   adresse         ← „stadt, land"
 *   email/telefon/notizen → 1:1
 *   status          ← 'prospect'
 *
 * Leads ohne Firma werden übersprungen. Bei Duplikaten (firmenname existiert
 * bereits als Kunde) wird ebenfalls übersprungen — idempotent.
 */
export async function importLeadsAsCustomers(
  companyId: string,
  leadIds: string[],
): Promise<LeadImportErgebnis> {
  if (leadIds.length === 0) return { created: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, vorname, nachname, email, telefon, firma, stadt, land, notizen')
    .eq('company', companyId)
    .in('id', leadIds);
  if (error) throw new Error('Leads konnten nicht geladen werden');

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of (leads ?? []) as Array<{
    id: string;
    vorname: string;
    nachname: string;
    email: string | null;
    telefon: string | null;
    firma: string | null;
    stadt: string | null;
    land: string | null;
    notizen: string | null;
  }>) {
    if (!lead.firma || lead.firma.trim() === '') {
      skipped++;
      continue;
    }

    const ansprechpartner =
      [lead.vorname, lead.nachname].filter((p) => p && p.trim().length > 0).join(' ').trim() || null;
    const adresse =
      [lead.stadt, lead.land].filter((p) => p && p.trim().length > 0).join(', ') || null;

    const { error: insErr } = await supabase.from('customers').insert({
      company: companyId,
      firmenname: lead.firma.trim(),
      ansprechpartner,
      email: lead.email,
      telefon: lead.telefon,
      adresse,
      notizen: lead.notizen,
      status: 'prospect',
    });

    if (insErr) {
      if (insErr.code === '23505') {
        skipped++;
      } else {
        errors.push(`${lead.firma}: ${insErr.message}`);
      }
    } else {
      created++;
    }
  }

  return { created, skipped, errors };
}
