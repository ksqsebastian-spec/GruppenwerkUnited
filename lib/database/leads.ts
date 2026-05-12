import sql from '@/lib/db';
import type { Lead, LeadInsert, LeadUpdate, LeadKommentar, LeadDatei } from '@/types';

export interface LeadFilter {
  search?: string;
  status?: string;
  prioritaet?: string;
  branche?: string;
}

export async function fetchLeads(companyId: string, filter: LeadFilter = {}): Promise<Lead[]> {
  const search = filter.search?.trim() ? `%${filter.search.trim()}%` : null;
  const rows = await sql`
    SELECT * FROM leads
    WHERE company = ${companyId}
    ${filter.status ? sql`AND status = ${filter.status}` : sql``}
    ${filter.prioritaet ? sql`AND prioritaet = ${filter.prioritaet}` : sql``}
    ${filter.branche ? sql`AND branche = ${filter.branche}` : sql``}
    ${search ? sql`AND (
      vorname ILIKE ${search} OR nachname ILIKE ${search} OR
      email ILIKE ${search} OR firma ILIKE ${search} OR position ILIKE ${search}
    )` : sql``}
    ORDER BY created_at DESC
  `;
  return rows as unknown as Lead[];
}

export async function fetchLead(id: string, companyId: string): Promise<Lead | null> {
  const rows = await sql`
    SELECT * FROM leads WHERE id = ${id} AND company = ${companyId} LIMIT 1
  `;
  return (rows[0] ?? null) as Lead | null;
}

export async function createLead(companyId: string, input: Omit<LeadInsert, 'company'>): Promise<Lead> {
  const rows = await sql`
    INSERT INTO leads ${sql({ ...input, company: companyId } as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Lead konnte nicht angelegt werden');
  return rows[0] as Lead;
}

export async function updateLead(id: string, companyId: string, update: LeadUpdate): Promise<Lead> {
  const rows = await sql`
    UPDATE leads SET ${sql(update as Record<string, unknown>)}
    WHERE id = ${id} AND company = ${companyId}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Lead konnte nicht aktualisiert werden');
  return rows[0] as Lead;
}

export async function deleteLead(id: string, companyId: string): Promise<void> {
  await sql`DELETE FROM leads WHERE id = ${id} AND company = ${companyId}`;
}

export async function upsertLeads(companyId: string, rows: Omit<LeadInsert, 'company'>[]): Promise<number> {
  if (rows.length === 0) return 0;
  const inserts = rows.map((r) => ({ ...r, company: companyId })) as Record<string, unknown>[];
  const result = await sql`
    INSERT INTO leads ${sql(inserts)}
    ON CONFLICT (company, email) DO NOTHING
    RETURNING id
  `;
  return result.length;
}

// ── Kommentare ────────────────────────────────────────────────────────────────

export async function fetchKommentare(leadId: string): Promise<LeadKommentar[]> {
  const rows = await sql`
    SELECT * FROM lead_kommentare WHERE lead_id = ${leadId} ORDER BY created_at ASC
  `;
  return rows as unknown as LeadKommentar[];
}

export async function createKommentar(leadId: string, companyId: string, text: string): Promise<LeadKommentar> {
  const rows = await sql`
    INSERT INTO lead_kommentare ${sql({ lead_id: leadId, company: companyId, text } as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Kommentar konnte nicht gespeichert werden');
  return rows[0] as LeadKommentar;
}

export async function deleteKommentar(id: string): Promise<void> {
  await sql`DELETE FROM lead_kommentare WHERE id = ${id}`;
}

// ── Dateianhänge ──────────────────────────────────────────────────────────────

export async function fetchDateien(leadId: string): Promise<LeadDatei[]> {
  const rows = await sql`
    SELECT * FROM lead_dateien WHERE lead_id = ${leadId} ORDER BY created_at DESC
  `;
  return rows as unknown as LeadDatei[];
}

export async function createDateiEintrag(
  leadId: string,
  companyId: string,
  meta: { dateiname: string; dateipfad: string; dateityp?: string; dateigroesse?: number }
): Promise<LeadDatei> {
  const rows = await sql`
    INSERT INTO lead_dateien ${sql({ lead_id: leadId, company: companyId, ...meta } as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Datei-Eintrag konnte nicht gespeichert werden');
  return rows[0] as LeadDatei;
}

export async function deleteDateiEintrag(id: string): Promise<void> {
  await sql`DELETE FROM lead_dateien WHERE id = ${id}`;
}

export async function getDateiDownloadUrl(_dateipfad: string): Promise<string> {
  throw new Error('Datei-Downloads sind auf Sevalla noch nicht verfügbar');
}
