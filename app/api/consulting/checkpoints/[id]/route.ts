import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteConsultingCheckpoint } from '@/lib/database/consulting';

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
    if (body.description !== undefined) update.description = body.description;
    if (body.active_fields !== undefined) update.active_fields = body.active_fields;
    const { error } = await supabase
      .from('consulting_checkpoints')
      .update(update)
      .eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    await deleteConsultingCheckpoint(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
