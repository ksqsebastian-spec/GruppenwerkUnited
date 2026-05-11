import { NextRequest, NextResponse } from 'next/server';
import { fetchVehicles, createVehicle } from '@/lib/database/vehicles';
import type { VehicleFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const fuelType = searchParams.get('fuelType') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const filters: VehicleFilters = { companyId, status, fuelType: fuelType as VehicleFilters['fuelType'], search };

  try {
    const rows = await fetchVehicles(filters);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Fahrzeuge konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await createVehicle(body as Parameters<typeof createVehicle>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fahrzeug konnte nicht angelegt werden' }, { status: 500 });
  }
}
