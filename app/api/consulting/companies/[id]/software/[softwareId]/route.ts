import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

interface Params { params: Promise<{ id: string; softwareId: string }> }

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id, softwareId } = await params;
    const body = await req.json() as Record<string, unknown>;
    const { error } = await createAdminClient()
      .from('consulting_company_software')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', softwareId)
      .eq('company_id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id, softwareId } = await params;
    const { error } = await createAdminClient()
      .from('consulting_company_software')
      .delete()
      .eq('id', softwareId)
      .eq('company_id', id);
    if (error) throw new Error(error.message);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
