import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/roi/uploads
 * Letzte Import-Protokolle aus dem roi-Schema laden
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Fehler beim Laden der Upload-Protokolle:', error);
    return NextResponse.json(
      { error: 'Upload-Protokolle konnten nicht geladen werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/roi/uploads
 * Import-Protokolleintrag und Aufträge im roi-Schema speichern
 * Body: { jobs: Job[], filename, rows_imported, rows_skipped, column_mapping }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

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

  // Aufträge im roi-Schema einfügen
  const { error: jobsError } = await supabase
    .schema('roi')
    .from('jobs')
    .insert(body.jobs);

  if (jobsError) {
    console.error('Fehler beim Import der Aufträge:', jobsError);
    return NextResponse.json(
      { error: `Import-Fehler: ${jobsError.message}` },
      { status: 500 }
    );
  }

  // Upload-Protokoll im roi-Schema speichern
  const { error: uploadError } = await supabase
    .schema('roi')
    .from('uploads')
    .insert({
      filename: body.filename,
      rows_imported: body.rows_imported,
      rows_skipped: body.rows_skipped,
      column_mapping: body.column_mapping,
    });

  if (uploadError) {
    // Nicht kritisch — Aufträge wurden bereits importiert
    console.error('Fehler beim Speichern des Upload-Protokolls:', uploadError);
  }

  return NextResponse.json({ success: true, imported: body.rows_imported }, { status: 201 });
}
