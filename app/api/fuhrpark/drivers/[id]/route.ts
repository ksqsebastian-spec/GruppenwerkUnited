import { NextRequest, NextResponse } from 'next/server';
import { fetchDriver, updateDriver, archiveDriver } from '@/lib/database/drivers';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const row = await fetchDriver(id, scope.companyId);
    if (!row) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    if (body.action === 'archive') {
      await archiveDriver(id, scope.companyId);
      return NextResponse.json({ success: true });
    }
    delete body.company_id; // Tenant-Wechsel verbieten
    const row = await updateDriver(id, body as Parameters<typeof updateDriver>[1], scope.companyId);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fahrer konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}
