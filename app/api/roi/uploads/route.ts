import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const rows = await sql`
      SELECT * FROM roi.uploads
      WHERE company_id = ${session.companyId}
      ORDER BY created_at DESC
      LIMIT 5
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Fehler beim Laden der Upload-Protokolle:', err);
    return NextResponse.json({ error: 'Upload-Protokolle konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: {
    jobs: Record<string, string | number | null>[];
    filename: string;
    rows_imported: number;
    rows_skipped: number;
    column_mapping: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const jobsWithCompany = body.jobs.map((job) => ({ ...job, company_id: session.companyId }));

  try {
    await sql`INSERT INTO roi.jobs ${sql(jobsWithCompany)}`;
  } catch (err) {
    console.error('Fehler beim Import der Aufträge:', err);
    return NextResponse.json({ error: `Import-Fehler: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  try {
    await sql`
      INSERT INTO roi.uploads (filename, rows_imported, rows_skipped, column_mapping, company_id)
      VALUES (${body.filename}, ${body.rows_imported}, ${body.rows_skipped}, ${JSON.stringify(body.column_mapping)}, ${session.companyId})
    `;
  } catch (err) {
    console.error('Fehler beim Speichern des Upload-Protokolls:', err);
  }

  return NextResponse.json({ success: true, imported: body.rows_imported }, { status: 201 });
}
