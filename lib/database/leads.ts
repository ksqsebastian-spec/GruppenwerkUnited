import { createAdminClient } from '@/lib/supabase/admin';
import type { Lead, LeadInsert, LeadUpdate, LeadKommentar, LeadDatei } from '@/types';

export interface LeadFilter {
  search?: string;
  status?: string;
  prioritaet?: string;
  branche?: string;
}

export async function fetchLeads(companyId: string, filter: LeadFilter = {}): Promise<Lead[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('leads')
    .select('*')
    .eq('company', companyId)
    .order('created_at', { ascending: false });

  if (filter.search) {
    const s = `%${filter.search}%`;
    query = query.or(
      `vorname.ilike.${s},nachname.ilike.${s},email.ilike.${s},firma.ilike.${s},position.ilike.${s}`
    );
  }
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.prioritaet) query = query.eq('prioritaet', filter.prioritaet);
  if (filter.branche) query = query.eq('branche', filter.branche);

  const { data, error } = await query;
  if (error) throw new Error('Leads konnten nicht geladen werden');
  return (data ?? []) as Lead[];
}

export async function fetchLead(id: string, companyId: string): Promise<Lead | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('company', companyId)
    .maybeSingle();
  if (error) throw new Error('Lead konnte nicht geladen werden');
  return data as Lead | null;
}

export async function createLead(companyId: string, input: Omit<LeadInsert, 'company'>): Promise<Lead> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({ ...input, company: companyId })
    .select()
    .single();
  if (error) throw new Error('Lead konnte nicht angelegt werden');
  return data as Lead;
}

export async function updateLead(id: string, companyId: string, update: LeadUpdate): Promise<Lead> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .eq('company', companyId)
    .select()
    .single();
  if (error) throw new Error('Lead konnte nicht aktualisiert werden');
  return data as Lead;
}

export async function deleteLead(id: string, companyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('company', companyId);
  if (error) throw new Error('Lead konnte nicht gelöscht werden');
}

export async function upsertLeads(companyId: string, rows: Omit<LeadInsert, 'company'>[]): Promise<number> {
  const supabase = createAdminClient();
  const inserts = rows.map((r) => ({ ...r, company: companyId }));
  const { data, error } = await supabase
    .from('leads')
    .upsert(inserts, { onConflict: 'company,email', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error('Import fehlgeschlagen: ' + error.message);
  return data?.length ?? 0;
}

// ── Kommentare ────────────────────────────────────────────────────────────────

export async function fetchKommentare(leadId: string): Promise<LeadKommentar[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lead_kommentare')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });
  if (error) throw new Error('Kommentare konnten nicht geladen werden');
  return (data ?? []) as LeadKommentar[];
}

export async function createKommentar(leadId: string, companyId: string, text: string): Promise<LeadKommentar> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lead_kommentare')
    .insert({ lead_id: leadId, company: companyId, text })
    .select()
    .single();
  if (error) throw new Error('Kommentar konnte nicht gespeichert werden');
  return data as LeadKommentar;
}

export async function deleteKommentar(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('lead_kommentare').delete().eq('id', id);
  if (error) throw new Error('Kommentar konnte nicht gelöscht werden');
}

// ── Dateianhänge ──────────────────────────────────────────────────────────────

export async function fetchDateien(leadId: string): Promise<LeadDatei[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lead_dateien')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Dateien konnten nicht geladen werden');
  return (data ?? []) as LeadDatei[];
}

export async function createDateiEintrag(
  leadId: string,
  companyId: string,
  meta: { dateiname: string; dateipfad: string; dateityp?: string; dateigroesse?: number }
): Promise<LeadDatei> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lead_dateien')
    .insert({ lead_id: leadId, company: companyId, ...meta })
    .select()
    .single();
  if (error) throw new Error('Datei-Eintrag konnte nicht gespeichert werden');
  return data as LeadDatei;
}

export async function deleteDateiEintrag(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('lead_dateien').delete().eq('id', id);
  if (error) throw new Error('Datei-Eintrag konnte nicht gelöscht werden');
}

export async function getDateiDownloadUrl(dateipfad: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from('lead-dateien')
    .createSignedUrl(dateipfad, 3600);
  if (error || !data?.signedUrl) throw new Error('Download-Link konnte nicht erstellt werden');
  return data.signedUrl;
}
