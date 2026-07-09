import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const body = await req.json();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('consulting_contacts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/consulting/contacts/[id] PATCH]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from('consulting_contacts').delete().eq('id', id);
  if (error) {
    console.error('[/api/consulting/contacts/[id] DELETE]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
