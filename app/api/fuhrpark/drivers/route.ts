import { NextRequest, NextResponse } from 'next/server';
import { fetchDrivers, createDriver } from '@/lib/database/drivers';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'active' | 'archived' | undefined;

  try {
    const rows = await fetchDrivers({ companyId: scope.companyId ?? undefined, status });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    if (scope.companyId) body.company_id = scope.companyId;
    const row = await createDriver(body as Parameters<typeof createDriver>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fahrer konnte nicht angelegt werden' },
      { status: 500 }
    );
  }
}
