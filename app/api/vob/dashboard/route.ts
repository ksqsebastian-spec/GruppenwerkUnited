import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vob/dashboard
 * Gibt alle Dashboard-Daten zurück: Unternehmen, letzter Scan, Ausschreibungen je Unternehmen, Trends.
 * Verwendet den Admin-Client um das vob-Schema sicher abzufragen.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const [
      { data: companies, error: companyError },
      { data: latestScanArr, error: scanError },
      { data: companyStats, error: statsError },
      { data: trends, error: trendError },
    ] = await Promise.all([
      supabase.schema('vob').from('companies').select('*').eq('active', true).order('name'),
      supabase.schema('vob').from('vob_scans').select('*').order('scan_date', { ascending: false }).limit(1),
      // Ausschreibungen je Unternehmen: alle aktiven Matches aus dem Dashboard-View
      supabase.schema('vob').from('vob_dashboard').select('*').not('company_slug', 'is', null).order('deadline_date', { ascending: true }),
      supabase.schema('vob').from('company_trends').select('*').order('year', { ascending: false }).order('calendar_week', { ascending: false }).limit(300),
    ])

    if (companyError) {
      console.error('Fehler beim Laden der Unternehmen:', companyError)
      return NextResponse.json({ error: 'Unternehmen konnten nicht geladen werden' }, { status: 500 })
    }
    if (scanError) {
      console.error('Fehler beim Laden des letzten Scans:', scanError)
      return NextResponse.json({ error: 'Scan-Daten konnten nicht geladen werden' }, { status: 500 })
    }
    if (statsError) {
      console.error('Fehler beim Laden der Unternehmens-Ausschreibungen:', statsError)
      return NextResponse.json({ error: 'Ausschreibungsdaten konnten nicht geladen werden' }, { status: 500 })
    }
    if (trendError) {
      console.error('Fehler beim Laden der Trends:', trendError)
      return NextResponse.json({ error: 'Trenddaten konnten nicht geladen werden' }, { status: 500 })
    }

    const latestScan = latestScanArr && latestScanArr.length > 0 ? latestScanArr[0] : null

    return NextResponse.json({
      companies: companies ?? [],
      latestScan,
      allMatches: companyStats ?? [],
      trends: trends ?? [],
    })
  } catch (err) {
    console.error('Unerwarteter Fehler im VOB Dashboard:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
