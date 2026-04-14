import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vob/scans
 * Gibt alle VOB-Scans in absteigender Reihenfolge zurück.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .schema('vob')
      .from('vob_scans')
      .select('*')
      .order('scan_date', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Scans:', error)
      return NextResponse.json({ error: 'Scans konnten nicht geladen werden' }, { status: 500 })
    }

    return NextResponse.json({ scans: data ?? [] })
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Scans:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
