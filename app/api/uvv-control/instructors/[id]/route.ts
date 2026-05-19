import { NextRequest, NextResponse } from 'next/server';
import { updateUvvInstructor, archiveUvvInstructor } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (b.action === 'archive') {
      await archiveUvvInstructor(id);
      return NextResponse.json({ success: true });
    }
    const row = await updateUvvInstructor(id, b as Parameters<typeof updateUvvInstructor>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Ausbilder konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
