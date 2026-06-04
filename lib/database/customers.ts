import { createAdminClient } from '@/lib/supabase/admin';
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

export async function fetchPrompts(companyId: string): Promise<CustomerPrompt[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('customer_prompts')
    .select('*')
    .eq('company', companyId)
    .order('kategorie', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });
  if (error) throw new Error('Prompt-Vorlagen konnten nicht geladen werden');
  return (data ?? []) as CustomerPrompt[];
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
  const { error } = await supabase
    .from('customer_prompts')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Vorlage konnte nicht gelöscht werden');
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

  const customerFields: Record<string, string | null> = {
    firmenname: customer.firmenname,
    ansprechpartner: customer.ansprechpartner,
    email: customer.email,
    telefon: customer.telefon,
    adresse: customer.adresse,
    notizen: customer.notizen,
    status: customer.status,
  };

  const missing = new Set<string>();
  const rendered = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    if (key.toLowerCase().startsWith('customer.')) {
      const field = key.slice(9).toLowerCase();
      const value = customerFields[field];
      if (value == null || value === '') {
        missing.add(key);
        return `<<UNGELÖST: ${key}>>`;
      }
      return value;
    }
    const value = dkMap.get(key.toUpperCase());
    if (value == null || value === '') {
      missing.add(key);
      return `<<UNGELÖST: ${key}>>`;
    }
    return value;
  });

  return { prompt: rendered, missing_placeholders: [...missing] };
}
