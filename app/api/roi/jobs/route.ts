import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/roi/jobs
 * Alle Aufträge aus dem roi-Schema laden
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('jobs')
    .select('*')
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

/**
 * POST /api/roi/jobs
 * Neuen Auftrag im roi-Schema anlegen
 * Body: { jahr, monat, datum }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

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

/**
 * PATCH /api/roi/jobs
 * Auftrag-Feld im roi-Schema aktualisieren
 * Body: { id, key, value }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

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

/**
 * DELETE /api/roi/jobs?id=...
 * Auftrag aus dem roi-Schema löschen
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Fehlende ID' }, { status: 400 });
  }

  const { error } = await supabase
    .schema('roi')
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Auftrags:', error);
    return NextResponse.json(
      { error: 'Auftrag konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
