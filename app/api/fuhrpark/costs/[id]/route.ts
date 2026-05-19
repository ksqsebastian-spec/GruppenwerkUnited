import { NextRequest, NextResponse } from 'next/server';
import { fetchCost, updateCost, deleteCost } from '@/lib/database/costs';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const row = await fetchCost(id, scope.companyId);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kosteneintrag nicht gefunden' },
      { status: 404 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await updateCost(id, body as Parameters<typeof updateCost>[1], scope.companyId);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kosteneintrag konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    await deleteCost(id, scope.companyId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kosteneintrag konnte nicht gelöscht werden' }, { status: 500 });
  }
}
