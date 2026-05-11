import { NextRequest, NextResponse } from 'next/server';
import { updateDamageStatus } from '@/lib/database/damages';
import type { DamageStatus } from '@/types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  let body: { status?: unknown };
  try {
    body = await request.json() as { status?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.status !== 'string') {
    return NextResponse.json({ error: 'status ist erforderlich' }, { status: 400 });
  }
  try {
    await updateDamageStatus(id, body.status as DamageStatus);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Status konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
