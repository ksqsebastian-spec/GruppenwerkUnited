import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let rows = await sql`SELECT * FROM roi.config WHERE company_id = ${session.companyId} LIMIT 1`;

  if (!rows[0]) {
    try {
      rows = await sql`INSERT INTO roi.config (company_id) VALUES (${session.companyId}) RETURNING *`;
    } catch (err) {
      console.error('Fehler beim Erstellen der ROI-Konfiguration:', err);
      return NextResponse.json({ error: 'Konfiguration konnte nicht geladen werden' }, { status: 500 });
    }
  }

  return NextResponse.json(rows[0]);
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { id: string; key: string; value: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  try {
    const updated = await sql`
      UPDATE roi.config
      SET ${sql({ [body.key]: body.value })}
      WHERE id = ${body.id} AND company_id = ${session.companyId}
      RETURNING *
    `;

    if (!updated[0]) {
      return NextResponse.json({ error: 'Konfiguration konnte nicht aktualisiert werden' }, { status: 500 });
    }

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Konfiguration:', err);
    return NextResponse.json({ error: 'Konfiguration konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
