import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/tenders/wipe
 * Löscht ALLE VOB-Ausschreibungen, Matches und Scans.
 * Achtung: Irreversibel! Nur für administrative Bereinigungen gedacht.
 */
export async function POST(): Promise<NextResponse> {
  const supabase = createAdminClient()

  // Reihenfolge: zuerst abhängige Tabellen löschen
  const { error: matchError } = await supabase
    .schema('vob')
    .from('vob_matches')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // alle Zeilen löschen

  if (matchError) {
    console.error('Fehler beim Löschen der Matches:', matchError)
    return NextResponse.json(
      { error: 'Matches konnten nicht gelöscht werden' },
      { status: 500 }
    )
  }

  const { error: tenderError } = await supabase
    .schema('vob')
    .from('vob_tenders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // alle Zeilen löschen

  if (tenderError) {
    console.error('Fehler beim Löschen der Ausschreibungen:', tenderError)
    return NextResponse.json(
      { error: 'Ausschreibungen konnten nicht gelöscht werden' },
      { status: 500 }
    )
  }

  const { error: scanError } = await supabase
    .schema('vob')
    .from('vob_scans')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // alle Zeilen löschen

  if (scanError) {
    console.error('Fehler beim Löschen der Scans:', scanError)
    return NextResponse.json(
      { error: 'Scans konnten nicht gelöscht werden' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
