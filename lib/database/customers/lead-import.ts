import { createAdminClient } from '@/lib/supabase/admin';

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
      ort: lead.stadt,
      land: lead.land,
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
