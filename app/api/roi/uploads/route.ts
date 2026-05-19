import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('uploads')
    .select('*')
    .eq('company_id', session.companyId)
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

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

  const { error: jobsError } = await supabase
    .schema('roi')
    .from('jobs')
    .insert(jobsWithCompany);

  if (jobsError) {
    console.error('Fehler beim Import der Aufträge:', jobsError);
    return NextResponse.json(
      { error: `Import-Fehler: ${jobsError.message}` },
      { status: 500 }
    );
  }

  const { error: uploadError } = await supabase
    .schema('roi')
    .from('uploads')
    .insert({
      filename: body.filename,
      rows_imported: body.rows_imported,
      rows_skipped: body.rows_skipped,
      column_mapping: body.column_mapping,
      company_id: session.companyId,
    });

  if (uploadError) {
    console.error('Fehler beim Speichern des Upload-Protokolls:', uploadError);
  }

  return NextResponse.json({ success: true, imported: body.rows_imported }, { status: 201 });
}
