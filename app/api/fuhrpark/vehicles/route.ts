import { NextRequest, NextResponse } from 'next/server';
import { fetchVehicles, createVehicle, syncLeasingAppointment, syncLeasingCost } from '@/lib/database/vehicles';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import type { VehicleFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const fuelType = searchParams.get('fuelType') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  // Tenant-Scoping: companyId IMMER aus Session, nie aus Client-Parametern.
  const filters: VehicleFilters = {
    companyId: scope.companyId ?? undefined,
    status: status as VehicleFilters['status'],
    fuelType: fuelType as VehicleFilters['fuelType'],
    search,
  };

  try {
    const rows = await fetchVehicles(filters);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[/api/fuhrpark/vehicles GET]', err);
    return NextResponse.json({ error: 'Fahrzeuge konnten nicht geladen werden' }, { status: 500 });
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
    // Mandanten können company_id nicht spoofen — wird serverseitig erzwungen.
    if (scope.companyId) body.company_id = scope.companyId;

    const row = await createVehicle(body as Parameters<typeof createVehicle>[0]);
    await Promise.all([
      syncLeasingAppointment(row.id, (body.leasing_end_date as string | null) ?? null, !!body.is_leased),
      syncLeasingCost(row.id, body.leasing_rate as number | null | undefined, !!body.is_leased),
    ]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fahrzeug konnte nicht angelegt werden' },
      { status: 500 }
    );
  }
}
