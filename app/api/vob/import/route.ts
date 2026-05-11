import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { suggestCompanies } from '@/lib/modules/vob/match-suggest';
import type { Company } from '@/lib/modules/vob/types';

interface TenderInput {
  title: string;
  authority?: string | null;
  deadline?: string | null;
  deadline_date?: string | null;
  category?: string | null;
  url: string;
}

interface ScanInput {
  scan_date: string;
  calendar_week: number;
  year: number;
  total_listings: number;
  new_listings: number;
  report_url?: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const importSecret = process.env.VOB_IMPORT_SECRET;
  if (!importSecret) {
    console.error('VOB_IMPORT_SECRET ist nicht konfiguriert');
    return NextResponse.json({ error: 'Import nicht konfiguriert' }, { status: 500 });
  }

  const providedSecret = request.headers.get('x-import-secret');
  if (!providedSecret || providedSecret !== importSecret) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  let body: { scan: ScanInput; tenders: TenderInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const { scan, tenders } = body;

  if (!scan?.scan_date || !scan?.calendar_week || !scan?.year) {
    return NextResponse.json({ error: 'scan.scan_date, scan.calendar_week und scan.year sind erforderlich' }, { status: 400 });
  }
  if (!Array.isArray(tenders) || tenders.length === 0) {
    return NextResponse.json({ error: 'tenders muss ein nicht-leeres Array sein' }, { status: 400 });
  }

  const errors: string[] = [];

  const companies = await sql`SELECT * FROM vob.companies WHERE active = true ORDER BY name`;
  if (!companies.length) {
    return NextResponse.json({ error: 'Unternehmen konnten nicht geladen werden' }, { status: 500 });
  }

  const [scanRow] = await sql`
    INSERT INTO vob.vob_scans (scan_date, calendar_week, year, total_listings, new_listings, report_url)
    VALUES (${scan.scan_date}, ${scan.calendar_week}, ${scan.year}, ${scan.total_listings}, ${scan.new_listings}, ${scan.report_url ?? null})
    RETURNING id
  `;

  if (!scanRow) {
    return NextResponse.json({ error: 'Scan konnte nicht angelegt werden' }, { status: 500 });
  }

  const scanId = (scanRow as { id: string }).id;
  let tendersInserted = 0;
  let matchesInserted = 0;
  let skipped = 0;

  for (const t of tenders) {
    if (!t.title || !t.url) {
      errors.push(`Übersprungen: Fehlende Pflichtfelder (title/url) – ${t.title ?? 'unbekannt'}`);
      skipped++;
      continue;
    }

    let tenderId: string;
    try {
      const [tenderRow] = await sql`
        INSERT INTO vob.vob_tenders (title, authority, deadline, deadline_date, category, url, status, scan_id, requested)
        VALUES (${t.title}, ${t.authority ?? null}, ${t.deadline ?? null}, ${t.deadline_date ?? null}, ${t.category ?? null}, ${t.url}, 'active', ${scanId}, false)
        RETURNING id
      `;
      if (!tenderRow) { skipped++; continue; }
      tenderId = (tenderRow as { id: string }).id;
      tendersInserted++;
    } catch (err) {
      errors.push(`Fehler bei "${t.title}": ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
      continue;
    }

    const matches = suggestCompanies(t.category ?? null, t.title, companies as unknown as Company[]);
    if (!matches.length) continue;

    const matchRows = matches.map((m) => ({
      tender_id: tenderId,
      company_id: m.company.id,
      company_slug: m.company.slug,
      relevance: m.relevance,
      reason: m.matchedTerms.join(', '),
    }));

    try {
      await sql`INSERT INTO vob.vob_matches ${sql(matchRows)}`;
      matchesInserted += matchRows.length;
    } catch (err) {
      errors.push(`Match-Fehler für "${t.title}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    await sql`UPDATE vob.vob_scans SET matched_count = ${matchesInserted} WHERE id = ${scanId}`;
  } catch (err) {
    errors.push(`Scan-Zähler konnte nicht aktualisiert werden: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({ scan_id: scanId, tenders_inserted: tendersInserted, matches_inserted: matchesInserted, skipped, errors });
}
