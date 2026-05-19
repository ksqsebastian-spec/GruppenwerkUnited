import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('purchases')
    .select('*')
    .eq('company_id', session.companyId)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Einkäufe:', error);
    return NextResponse.json(
      { error: 'Einkäufe konnten nicht geladen werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

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

  const { data, error } = await supabase
    .schema('roi')
    .from('purchases')
    .insert(rowsWithCompany)
    .select();

  if (error) {
    console.error('Fehler beim Speichern der Einkäufe:', error);
    return NextResponse.json(
      { error: 'Einkäufe konnten nicht gespeichert werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Fehlende ID' }, { status: 400 });
  }

  const { error } = await supabase
    .schema('roi')
    .from('purchases')
    .delete()
    .eq('id', id)
    .eq('company_id', session.companyId);

  if (error) {
    console.error('Fehler beim Löschen des Einkaufs:', error);
    return NextResponse.json(
      { error: 'Einkauf konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
