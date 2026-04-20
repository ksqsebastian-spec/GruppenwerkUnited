import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/vob/scans/[id]
 * Aktualisiert einen VOB-Scan – primär zum Setzen der report_url nach Storage-Upload.
 * Auth via x-import-secret Header.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const importSecret = process.env.VOB_IMPORT_SECRET
  if (!importSecret) {
    return NextResponse.json({ error: 'Import nicht konfiguriert' }, { status: 500 })
  }

  const providedSecret = request.headers.get('x-import-secret')
  if (!providedSecret || providedSecret !== importSecret) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { id } = await params

  let body: { report_url?: string; matched_count?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.report_url !== undefined) updates.report_url = body.report_url
  if (body.matched_count !== undefined) updates.matched_count = body.matched_count

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .schema('vob')
    .from('vob_scans')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Fehler beim Aktualisieren des Scans:', error)
    return NextResponse.json({ error: 'Scan konnte nicht aktualisiert werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
