import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { updateConsultingCheckpointStatus } from '@/lib/database/consulting';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await updateConsultingCheckpointStatus(id, body, session.companyId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[/api/consulting/checkpoint-status/[id] PATCH]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
