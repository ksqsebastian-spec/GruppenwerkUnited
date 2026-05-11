import sql from '@/lib/db';
import type { VehicleDriver, VehicleDriverInsert } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export async function fetchVehicleDrivers(vehicleId: string): Promise<VehicleDriver[]> {
  const rows = await sql`
    SELECT vd.*,
      json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name, 'email', d.email, 'phone', d.phone) AS driver
    FROM vehicle_drivers vd
    JOIN drivers d ON d.id = vd.driver_id
    WHERE vd.vehicle_id = ${vehicleId}
    ORDER BY vd.is_primary DESC
  `;
  return rows as unknown as VehicleDriver[];
}

export async function fetchDriverVehicles(driverId: string): Promise<VehicleDriver[]> {
  const rows = await sql`
    SELECT vd.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle
    FROM vehicle_drivers vd
    JOIN vehicles v ON v.id = vd.vehicle_id
    WHERE vd.driver_id = ${driverId}
    ORDER BY vd.is_primary DESC
  `;
  return rows as unknown as VehicleDriver[];
}

export async function assignDriverToVehicle(data: VehicleDriverInsert): Promise<VehicleDriver> {
  if (data.is_primary) {
    await sql`UPDATE vehicle_drivers SET is_primary = false WHERE vehicle_id = ${data.vehicle_id}`;
  }

  try {
    const rows = await sql`
      INSERT INTO vehicle_drivers ${sql(data as Record<string, unknown>)}
      RETURNING *
    `;
    return rows[0] as VehicleDriver;
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === '23505') throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_ALREADY_ASSIGNED);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_ASSIGN_FAILED);
  }
}

export async function unassignDriverFromVehicle(vehicleId: string, driverId: string): Promise<void> {
  await sql`
    DELETE FROM vehicle_drivers WHERE vehicle_id = ${vehicleId} AND driver_id = ${driverId}
  `;
}

export async function setPrimaryDriver(vehicleId: string, driverId: string): Promise<void> {
  await sql`UPDATE vehicle_drivers SET is_primary = false WHERE vehicle_id = ${vehicleId}`;
  await sql`
    UPDATE vehicle_drivers SET is_primary = true
    WHERE vehicle_id = ${vehicleId} AND driver_id = ${driverId}
  `;
}
