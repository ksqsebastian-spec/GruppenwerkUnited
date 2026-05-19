import { NextRequest, NextResponse } from 'next/server';
import { fetchDamages, createDamage } from '@/lib/database/damages';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import type { DamageFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  try {
    const rows = await fetchDamages({
      vehicleId,
      status: status as DamageFilters['status'],
      tenantCompanyId: scope.companyId,
    });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Schäden konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await createDamage(body as Parameters<typeof createDamage>[0], scope.companyId);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Schaden konnte nicht gemeldet werden' },
      { status: 500 }
    );
  }
}
