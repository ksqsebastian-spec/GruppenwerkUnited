import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vob/stats
 * Gibt aggregierte Statistiken zurück:
 * - Gesamtzahl der Ausschreibungen
 * - Anzahl aktiver Ausschreibungen
 * - Anzahl der Matches (Unternehmens-Zuordnungen)
 * - Letzter Scan
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const [
      { count: totalTenders, error: totalError },
      { count: activeTenders, error: activeError },
      { count: totalMatches, error: matchError },
      { data: latestScanArr, error: scanError },
    ] = await Promise.all([
      supabase.schema('vob').from('vob_tenders').select('*', { count: 'exact', head: true }),
      supabase.schema('vob').from('vob_tenders').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.schema('vob').from('vob_matches').select('*', { count: 'exact', head: true }),
      supabase.schema('vob').from('vob_scans').select('*').order('scan_date', { ascending: false }).limit(1),
    ])

    if (totalError) console.error('Fehler beim Laden der Gesamtanzahl:', totalError)
    if (activeError) console.error('Fehler beim Laden der aktiven Ausschreibungen:', activeError)
    if (matchError) console.error('Fehler beim Laden der Matches:', matchError)
    if (scanError) console.error('Fehler beim Laden des letzten Scans:', scanError)

    const latestScan = latestScanArr && latestScanArr.length > 0 ? latestScanArr[0] : null

    return NextResponse.json({
      totalTenders: totalTenders ?? 0,
      activeTenders: activeTenders ?? 0,
      totalMatches: totalMatches ?? 0,
      latestScan,
    })
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der VOB-Statistiken:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
