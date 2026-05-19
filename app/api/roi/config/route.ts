import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  let { data, error } = await supabase
    .schema('roi')
    .from('config')
    .select('*')
    .eq('company_id', session.companyId)
    .limit(1)
    .single();

  // Noch keine Konfiguration für diese Firma — Standard-Zeile anlegen
  if (error?.code === 'PGRST116' || !data) {
    const { data: created, error: createError } = await supabase
      .schema('roi')
      .from('config')
      .insert({ company_id: session.companyId })
      .select()
      .single();

    if (createError) {
      console.error('Fehler beim Erstellen der ROI-Konfiguration:', createError);
      return NextResponse.json(
        { error: 'Konfiguration konnte nicht geladen werden' },
        { status: 500 }
      );
    }

    data = created;
    error = null;
  }

  if (error) {
    console.error('Fehler beim Laden der ROI-Konfiguration:', error);
    return NextResponse.json(
      { error: 'Konfiguration konnte nicht geladen werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = createAdminClient();

  let body: { id: string; key: string; value: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const { data, error } = await supabase
    .schema('roi')
    .from('config')
    .update({ [body.key]: body.value })
    .eq('id', body.id)
    .eq('company_id', session.companyId)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Konfiguration:', error);
    return NextResponse.json(
      { error: 'Konfiguration konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
