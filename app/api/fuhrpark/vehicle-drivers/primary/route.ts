import { NextRequest, NextResponse } from 'next/server';
import { setPrimaryDriver } from '@/lib/database/vehicle-drivers';

export async function PATCH(request: NextRequest): Promise<NextResponse> {
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
    await setPrimaryDriver(body.vehicleId, body.driverId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Hauptfahrer konnte nicht gesetzt werden' }, { status: 500 });
  }
}
