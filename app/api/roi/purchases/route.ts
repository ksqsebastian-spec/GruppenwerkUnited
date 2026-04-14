import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/roi/purchases
 * Alle Marketing-Einkäufe aus dem roi-Schema laden
 */
export async function GET(): Promise<NextResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .schema('roi')
    .from('purchases')
    .select('*')
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

/**
 * POST /api/roi/purchases
 * Neue Einkäufe im roi-Schema speichern
 * Body: Array von { channel_id, channel_name, amount, pricing, note, purchased_at }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const { data, error } = await supabase
    .schema('roi')
    .from('purchases')
    .insert(body)
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

/**
 * DELETE /api/roi/purchases?id=...
 * Einkauf aus dem roi-Schema löschen
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = createAdminClient();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Fehlende ID' }, { status: 400 });
  }

  const { error } = await supabase
    .schema('roi')
    .from('purchases')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Einkaufs:', error);
    return NextResponse.json(
      { error: 'Einkauf konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
