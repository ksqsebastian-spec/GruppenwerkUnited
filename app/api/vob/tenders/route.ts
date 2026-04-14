import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vob/tenders?page=1&pageSize=50&company=slug&status=active
 * Gibt paginierte Ausschreibungen zurück.
 * Verwendet den Admin-Client um das vob-Schema sicher abzufragen.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)))
    const companySlug = searchParams.get('company') ?? null
    const status = searchParams.get('status') ?? null

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const supabase = createAdminClient()

    let query = supabase
      .schema('vob')
      .from('vob_dashboard')
      .select('*', { count: 'exact' })
      .order('deadline_date', { ascending: true })
      .range(from, to)

    if (companySlug) {
      query = query.eq('company_slug', companySlug)
    }
    if (status === 'active') {
      query = query.eq('status', 'active')
    } else if (status === 'expired') {
      query = query.eq('status', 'expired')
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Fehler beim Laden der Ausschreibungen:', error)
      return NextResponse.json({ error: 'Ausschreibungen konnten nicht geladen werden' }, { status: 500 })
    }

    return NextResponse.json({
      tenders: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    })
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Ausschreibungen:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
