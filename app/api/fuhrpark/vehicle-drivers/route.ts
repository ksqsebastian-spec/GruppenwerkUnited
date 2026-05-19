import { NextRequest, NextResponse } from 'next/server';
import {
  fetchVehicleDrivers,
  fetchDriverVehicles,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
} from '@/lib/database/vehicle-drivers';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');
  const driverId = searchParams.get('driverId');

  try {
    if (vehicleId) {
      const rows = await fetchVehicleDrivers(vehicleId, scope.companyId);
      return NextResponse.json(rows);
    }
    if (driverId) {
      const rows = await fetchDriverVehicles(driverId, scope.companyId);
      return NextResponse.json(rows);
    }
    return NextResponse.json({ error: 'vehicleId oder driverId erforderlich' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Fahrzeug-Fahrer konnten nicht geladen werden' }, { status: 500 });
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
    const row = await assignDriverToVehicle(
      body as Parameters<typeof assignDriverToVehicle>[0],
      scope.companyId
    );
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fahrer konnte nicht zugewiesen werden' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: { vehicleId?: unknown; driverId?: unknown };
  try {
    body = await request.json() as { vehicleId?: unknown; driverId?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.vehicleId !== 'string' || typeof body.driverId !== 'string') {
    return NextResponse.json({ error: 'vehicleId und driverId erforderlich' }, { status: 400 });
  }
  try {
    await unassignDriverFromVehicle(body.vehicleId, body.driverId, scope.companyId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Zuweisung konnte nicht entfernt werden' }, { status: 500 });
  }
}
