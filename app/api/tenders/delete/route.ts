import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/tenders/delete
 * Löscht eine oder mehrere VOB-Ausschreibungen anhand ihrer IDs.
 * Zugehörige Matches werden kaskadierend gelöscht (CASCADE).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let ids: string[]

  try {
    const body = await request.json() as { ids?: unknown }
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: 'Ungültige Anfrage: ids muss ein nicht-leeres Array sein' },
        { status: 400 }
      )
    }
    ids = body.ids as string[]
  } catch {
    return NextResponse.json(
      { error: 'Ungültiges JSON' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .schema('vob')
    .from('vob_tenders')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Fehler beim Löschen der Ausschreibungen:', error)
    return NextResponse.json(
      { error: 'Ausschreibungen konnten nicht gelöscht werden' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: ids.length })
}
