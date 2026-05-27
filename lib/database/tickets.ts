import { createAdminClient } from '@/lib/supabase/admin';
import type {
  Ticket,
  TicketInsert,
  TicketUpdate,
  TicketDatei,
  Person,
  PersonInsert,
  PersonUpdate,
} from '@/types';

export interface TicketFilter {
  status?: string;
  urgency?: string;
  firma?: string;
}

// ── Tickets (firmenübergreifend – alle sehen alle) ─────────────────────────────

export async function fetchTickets(filter: TicketFilter = {}): Promise<Ticket[]> {
  const supabase = createAdminClient();
  let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

  if (filter.status) query = query.eq('status', filter.status);
  if (filter.urgency) query = query.eq('urgency', filter.urgency);
  if (filter.firma) query = query.eq('firma', filter.firma);

  const { data, error } = await query;
  if (error) throw new Error('Tickets konnten nicht geladen werden');
  return (data ?? []) as Ticket[];
}

export async function createTicket(companyId: string, input: TicketInsert): Promise<Ticket> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...input, created_by_company: companyId })
    .select()
    .single();
  if (error) throw new Error('Ticket konnte nicht angelegt werden');
  return data as Ticket;
}

export async function updateTicket(id: string, update: TicketUpdate): Promise<Ticket> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('tickets').update(update).eq('id', id).select().single();
  if (error) throw new Error('Ticket konnte nicht aktualisiert werden');
  return data as Ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw new Error('Ticket konnte nicht gelöscht werden');
}

// ── Personen (je Firma) ────────────────────────────────────────────────────────

export async function fetchPersonen(): Promise<Person[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('personen').select('*').order('name', { ascending: true });
  if (error) throw new Error('Personen konnten nicht geladen werden');
  return (data ?? []) as Person[];
}

export async function createPerson(companyId: string, input: Omit<PersonInsert, 'company'>): Promise<Person> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('personen')
    .insert({ ...input, company: companyId })
    .select()
    .single();
  if (error) throw new Error('Person konnte nicht angelegt werden');
  return data as Person;
}

export async function updatePerson(id: string, update: PersonUpdate): Promise<Person> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('personen').update(update).eq('id', id).select().single();
  if (error) throw new Error('Person konnte nicht aktualisiert werden');
  return data as Person;
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('personen').delete().eq('id', id);
  if (error) throw new Error('Person konnte nicht gelöscht werden');
}

// ── Dateianhänge ──────────────────────────────────────────────────────────────

export async function fetchTicketDateien(ticketId: string): Promise<TicketDatei[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ticket_dateien')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Dateien konnten nicht geladen werden');
  return (data ?? []) as TicketDatei[];
}

export async function createTicketDateiEintrag(
  ticketId: string,
  companyId: string,
  meta: { dateiname: string; dateipfad: string; dateityp?: string; dateigroesse?: number },
): Promise<TicketDatei> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ticket_dateien')
    .insert({ ticket_id: ticketId, company: companyId, ...meta })
    .select()
    .single();
  if (error) throw new Error('Datei-Eintrag konnte nicht gespeichert werden');
  return data as TicketDatei;
}

export async function deleteTicketDateiEintrag(id: string): Promise<TicketDatei | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ticket_dateien').delete().eq('id', id).select().maybeSingle();
  if (error) throw new Error('Datei-Eintrag konnte nicht gelöscht werden');
  return data as TicketDatei | null;
}

export async function getTicketDateiDownloadUrl(dateipfad: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from('ticket-dateien').createSignedUrl(dateipfad, 3600);
  if (error || !data?.signedUrl) throw new Error('Download-Link konnte nicht erstellt werden');
  return data.signedUrl;
}

export async function removeTicketDateiAusStorage(dateipfad: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from('ticket-dateien').remove([dateipfad]);
}
