import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const rows = await sql`
      SELECT * FROM roi.purchases
      WHERE company_id = ${session.companyId}
      ORDER BY purchased_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Fehler beim Laden der Einkäufe:', err);
    return NextResponse.json({ error: 'Einkäufe konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: Record<string, string | number | null>[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: 'Keine Einkäufe übergeben' }, { status: 400 });
  }

  const rowsWithCompany = body.map((row) => ({ ...row, company_id: session.companyId }));

  try {
    const inserted = await sql`INSERT INTO roi.purchases ${sql(rowsWithCompany)} RETURNING *`;
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error('Fehler beim Speichern der Einkäufe:', err);
    return NextResponse.json({ error: 'Einkäufe konnten nicht gespeichert werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Fehlende ID' }, { status: 400 });

  try {
    await sql`DELETE FROM roi.purchases WHERE id = ${id} AND company_id = ${session.companyId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Einkaufs:', err);
    return NextResponse.json({ error: 'Einkauf konnte nicht gelöscht werden' }, { status: 500 });
  }
}
