import { NextRequest, NextResponse } from 'next/server';
import { setPrimaryDriver } from '@/lib/database/vehicle-drivers';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function PATCH(request: NextRequest): Promise<NextResponse> {
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
    await setPrimaryDriver(body.vehicleId, body.driverId, scope.companyId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Hauptfahrer konnte nicht gesetzt werden' }, { status: 500 });
  }
}
