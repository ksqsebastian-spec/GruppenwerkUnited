import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/tenders/requested
 * Setzt das "requested"-Flag einer VOB-Ausschreibung (angefordert / nicht angefordert).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let id: string
  let requested: boolean

  try {
    const body = await request.json() as { id?: unknown; requested?: unknown }
    if (typeof body.id !== 'string' || body.id.trim() === '') {
      return NextResponse.json(
        { error: 'Ungültige Anfrage: id muss eine nicht-leere Zeichenkette sein' },
        { status: 400 }
      )
    }
    if (typeof body.requested !== 'boolean') {
      return NextResponse.json(
        { error: 'Ungültige Anfrage: requested muss ein Boolean sein' },
        { status: 400 }
      )
    }
    id = body.id
    requested = body.requested
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
    .update({ requested })
    .eq('id', id)

  if (error) {
    console.error('Fehler beim Aktualisieren des requested-Flags:', error)
    return NextResponse.json(
      { error: 'Status konnte nicht aktualisiert werden' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, id, requested })
}
