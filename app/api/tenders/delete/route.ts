import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let ids: string[];

  try {
    const body = await request.json() as { ids?: unknown };
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Ungültige Anfrage: ids muss ein nicht-leeres Array sein' }, { status: 400 });
    }
    ids = body.ids as string[];
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM vob.vob_tenders WHERE id = ANY(${ids}::uuid[])`;
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('Fehler beim Löschen der Ausschreibungen:', err);
    return NextResponse.json({ error: 'Ausschreibungen konnten nicht gelöscht werden' }, { status: 500 });
  }
}
