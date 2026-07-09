import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const body = await req.json();
    const supabase = createAdminClient();
    const update: Record<string, unknown> = {};
    if (body.label !== undefined) update.label = body.label;
    if (body.is_enabled !== undefined) update.is_enabled = body.is_enabled;
    if (body.sort_order !== undefined) update.sort_order = body.sort_order;
    const { error } = await supabase.from('consulting_field_types').update(update).eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/consulting/field-types/[id] PATCH]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from('consulting_field_types').delete().eq('id', id);
  if (error) {
    console.error('[/api/consulting/field-types/[id] DELETE]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
