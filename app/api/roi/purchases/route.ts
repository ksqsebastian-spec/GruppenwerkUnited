import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/roi/purchases
 * Alle Marketing-Einkäufe aus dem roi-Schema laden
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

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
 * DELETE /api/roi/purchases?id=...
 * Einkauf aus dem roi-Schema löschen
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServiceRoleClient();

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
