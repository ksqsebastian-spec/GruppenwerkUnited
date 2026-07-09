import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { updateConsultingCompany, deleteConsultingCompany } from '@/lib/database/consulting';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const body = await req.json();
    await updateConsultingCompany(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/consulting/companies/[id] PATCH]', error);
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
  try {
    await deleteConsultingCompany(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/consulting/companies/[id] DELETE]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
