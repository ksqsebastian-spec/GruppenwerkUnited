import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vob/companies
 * GET /api/vob/companies?slug=xxx
 * Gibt alle aktiven Unternehmen oder ein einzelnes Unternehmen zurück.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    const supabase = createAdminClient()

    if (slug) {
      const { data, error } = await supabase
        .schema('vob')
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 })
      }

      return NextResponse.json({ company: data })
    }

    // Alle aktiven Unternehmen
    const { data, error } = await supabase
      .schema('vob')
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Fehler beim Laden der Unternehmen:', error)
      return NextResponse.json({ error: 'Unternehmen konnten nicht geladen werden' }, { status: 500 })
    }

    return NextResponse.json({ companies: data ?? [] })
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Unternehmen:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
