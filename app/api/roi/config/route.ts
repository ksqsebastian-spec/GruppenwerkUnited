import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/roi/config
 * ROI-Konfiguration aus dem roi-Schema laden
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('config')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Fehler beim Laden der ROI-Konfiguration:', error);
    return NextResponse.json(
      { error: 'Konfiguration konnte nicht geladen werden' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * PATCH /api/roi/config
 * Konfigurationsfeld im roi-Schema aktualisieren
 * Body: { id, key, value }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

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
