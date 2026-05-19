import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { suggestCompanies } from '@/lib/modules/vob/match-suggest'
import type { Company } from '@/lib/modules/vob/types'

/**
 * Eingabe-Schema für eine einzelne Ausschreibung beim Import
 */
interface TenderInput {
  title: string
  authority?: string | null
  deadline?: string | null
  deadline_date?: string | null
  category?: string | null
  url: string
}

/**
 * Eingabe-Schema für den Scan-Kopf
 */
interface ScanInput {
  scan_date: string       // ISO-Datum, z.B. "2026-04-20"
  calendar_week: number
  year: number
  total_listings: number
  new_listings: number
  report_url?: string | null
}

/**
 * POST /api/vob/import
 *
 * Importiert einen VOB-Scan mit Ausschreibungen, matched automatisch alle
 * Werkbank-Unternehmen via suggestCompanies und speichert alles in Supabase.
 *
 * Authentifizierung: Header "x-import-secret" muss mit VOB_IMPORT_SECRET übereinstimmen.
 *
 * Body:
 * {
 *   scan: ScanInput,
 *   tenders: TenderInput[]
 * }
 *
 * Response:
 * {
 *   scan_id: string,
 *   tenders_inserted: number,
 *   matches_inserted: number,
 *   skipped: number,
 *   errors: string[]
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authentifizierung via Secret
  const importSecret = process.env.VOB_IMPORT_SECRET
  if (!importSecret) {
    console.error('VOB_IMPORT_SECRET ist nicht konfiguriert')
    return NextResponse.json({ error: 'Import nicht konfiguriert' }, { status: 500 })
  }

  const providedSecret = request.headers.get('x-import-secret')
  if (!providedSecret || providedSecret !== importSecret) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  let body: { scan: ScanInput; tenders: TenderInput[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const { scan, tenders } = body

  if (!scan?.scan_date || !scan?.calendar_week || !scan?.year) {
    return NextResponse.json({ error: 'scan.scan_date, scan.calendar_week und scan.year sind erforderlich' }, { status: 400 })
  }
  if (!Array.isArray(tenders) || tenders.length === 0) {
    return NextResponse.json({ error: 'tenders muss ein nicht-leeres Array sein' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const errors: string[] = []

  // 1. Alle aktiven Werkbank-Unternehmen laden
  const { data: companies, error: companyError } = await supabase
    .schema('vob')
    .from('companies')
    .select('*')
    .eq('active', true)
    .order('name')

  if (companyError || !companies) {
    console.error('Fehler beim Laden der Unternehmen:', companyError)
    return NextResponse.json({ error: 'Unternehmen konnten nicht geladen werden' }, { status: 500 })
  }

  // 2. Scan anlegen
  const { data: scanRow, error: scanError } = await supabase
    .schema('vob')
    .from('vob_scans')
    .insert({
      scan_date: scan.scan_date,
      calendar_week: scan.calendar_week,
      year: scan.year,
      total_listings: scan.total_listings,
      new_listings: scan.new_listings,
      report_url: scan.report_url ?? null,
    })
    .select()
    .single()

  if (scanError || !scanRow) {
    console.error('Fehler beim Anlegen des Scans:', scanError)
    return NextResponse.json({ error: 'Scan konnte nicht angelegt werden' }, { status: 500 })
  }

  const scanId: string = (scanRow as { id: string }).id

  // 3. Ausschreibungen mit automatischem Matching importieren
  let tendersInserted = 0
  let matchesInserted = 0
  let skipped = 0

  for (const t of tenders) {
    if (!t.title || !t.url) {
      errors.push(`Übersprungen: Fehlende Pflichtfelder (title/url) – ${t.title ?? 'unbekannt'}`)
      skipped++
      continue
    }

    // Ausschreibung speichern
    const { data: tenderRow, error: tenderError } = await supabase
      .schema('vob')
      .from('vob_tenders')
      .insert({
        title: t.title,
        authority: t.authority ?? null,
        deadline: t.deadline ?? null,
        deadline_date: t.deadline_date ?? null,
        category: t.category ?? null,
        url: t.url,
        status: 'active',
        scan_id: scanId,
        requested: false,
      })
      .select('id')
      .single()

    if (tenderError || !tenderRow) {
      errors.push(`Fehler bei "${t.title}": ${tenderError?.message ?? 'Unbekannt'}`)
      skipped++
      continue
    }

    tendersInserted++
    const tenderId: string = (tenderRow as { id: string }).id

    // Matching: alle passenden Werkbank-Unternehmen ermitteln
    const matches = suggestCompanies(t.category ?? null, t.title, companies as Company[])

    if (matches.length === 0) continue

    // Matches in Batch einfügen
    const matchRows = matches.map((m) => ({
      tender_id: tenderId,
      company_id: m.company.id,
      company_slug: m.company.slug,
      relevance: m.relevance,
      reason: m.matchedTerms.join(', '),
    }))

    const { error: matchError } = await supabase
      .schema('vob')
      .from('vob_matches')
      .insert(matchRows)

    if (matchError) {
      errors.push(`Match-Fehler für "${t.title}": ${matchError.message}`)
    } else {
      matchesInserted += matchRows.length
    }
  }

  // 4. Scan-Zähler aktualisieren
  const { error: updateError } = await supabase
    .schema('vob')
    .from('vob_scans')
    .update({ matched_count: matchesInserted })
    .eq('id', scanId)

  if (updateError) {
    errors.push(`Scan-Zähler konnte nicht aktualisiert werden: ${updateError.message}`)
  }

  return NextResponse.json({
    scan_id: scanId,
    tenders_inserted: tendersInserted,
    matches_inserted: matchesInserted,
    skipped,
    errors,
  })
}
