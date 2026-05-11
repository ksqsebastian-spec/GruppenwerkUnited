import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const importSecret = process.env.VOB_IMPORT_SECRET;
  if (!importSecret) {
    return NextResponse.json({ error: 'Import nicht konfiguriert' }, { status: 500 });
  }

  const providedSecret = request.headers.get('x-import-secret');
  if (!providedSecret || providedSecret !== importSecret) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;

  let body: { report_url?: string; matched_count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.report_url !== undefined) updates.report_url = body.report_url;
  if (body.matched_count !== undefined) updates.matched_count = body.matched_count;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
  }

  try {
    await sql`UPDATE vob.vob_scans SET ${sql(updates)} WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Scans:', err);
    return NextResponse.json({ error: 'Scan konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
