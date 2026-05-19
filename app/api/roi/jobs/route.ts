import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('jobs')
    .select('*')
    .eq('company_id', session.companyId)
    .order('datum', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Aufträge:', error);
    return NextResponse.json(
      { error: 'Aufträge konnten nicht geladen werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  let body: { jahr: number; monat: string; datum: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const { data, error } = await supabase
    .schema('roi')
    .from('jobs')
    .insert({
      jahr: body.jahr,
      monat: body.monat,
      datum: body.datum,
      company_id: session.companyId,
    })
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Anlegen des Auftrags:', error);
    return NextResponse.json(
      { error: 'Auftrag konnte nicht angelegt werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  let body: { id: string; key: string; value: string | number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const { data, error } = await supabase
    .schema('roi')
    .from('jobs')
    .update({ [body.key]: body.value })
    .eq('id', body.id)
    .eq('company_id', session.companyId)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Auftrags:', error);
    return NextResponse.json(
      { error: 'Auftrag konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
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
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('company_id', session.companyId);

  if (error) {
    console.error('Fehler beim Löschen des Auftrags:', error);
    return NextResponse.json(
      { error: 'Auftrag konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
