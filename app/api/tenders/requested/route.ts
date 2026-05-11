import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let id: string;
  let requested: boolean;

  try {
    const body = await request.json() as { id?: unknown; requested?: unknown };
    if (typeof body.id !== 'string' || body.id.trim() === '') {
      return NextResponse.json({ error: 'Ungültige Anfrage: id muss eine nicht-leere Zeichenkette sein' }, { status: 400 });
    }
    if (typeof body.requested !== 'boolean') {
      return NextResponse.json({ error: 'Ungültige Anfrage: requested muss ein Boolean sein' }, { status: 400 });
    }
    id = body.id;
    requested = body.requested;
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  try {
    await sql`UPDATE vob.vob_tenders SET requested = ${requested} WHERE id = ${id}`;
    return NextResponse.json({ success: true, id, requested });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des requested-Flags:', err);
    return NextResponse.json({ error: 'Status konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
