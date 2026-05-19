import { NextRequest, NextResponse } from 'next/server';
import { completeAppointment } from '@/lib/database/appointments';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    await completeAppointment(id, scope.companyId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Termin konnte nicht abgeschlossen werden' }, { status: 500 });
  }
}
