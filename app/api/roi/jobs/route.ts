import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const rows = await sql`
      SELECT * FROM roi.jobs
      WHERE company_id = ${session.companyId}
      ORDER BY datum DESC, created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Fehler beim Laden der Aufträge:', err);
    return NextResponse.json({ error: 'Aufträge konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { jahr: number; monat: string; datum: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  try {
    const [row] = await sql`
      INSERT INTO roi.jobs (jahr, monat, datum, company_id)
      VALUES (${body.jahr}, ${body.monat}, ${body.datum}, ${session.companyId})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('Fehler beim Anlegen des Auftrags:', err);
    return NextResponse.json({ error: 'Auftrag konnte nicht angelegt werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { id: string; key: string; value: string | number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  try {
    const updated = await sql`
      UPDATE roi.jobs
      SET ${sql({ [body.key]: body.value })}
      WHERE id = ${body.id} AND company_id = ${session.companyId}
      RETURNING *
    `;
    if (!updated[0]) {
      return NextResponse.json({ error: 'Auftrag konnte nicht aktualisiert werden' }, { status: 500 });
    }
    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Auftrags:', err);
    return NextResponse.json({ error: 'Auftrag konnte nicht aktualisiert werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Fehlende ID' }, { status: 400 });

  try {
    await sql`DELETE FROM roi.jobs WHERE id = ${id} AND company_id = ${session.companyId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Auftrags:', err);
    return NextResponse.json({ error: 'Auftrag konnte nicht gelöscht werden' }, { status: 500 });
  }
}
