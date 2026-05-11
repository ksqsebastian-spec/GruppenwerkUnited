import sql from '@/lib/db';
import type { Driver, DriverInsert, DriverUpdate } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export async function fetchDrivers(filters?: { companyId?: string; status?: 'active' | 'archived' }): Promise<Driver[]> {
  const rows = await sql`
    SELECT d.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(json_build_object(
          'id', vd.id, 'is_primary', vd.is_primary,
          'vehicle', json_build_object('id', v.id, 'license_plate', v.license_plate)
        )) FILTER (WHERE vd.id IS NOT NULL), '[]'
      ) AS vehicle_drivers
    FROM drivers d
    LEFT JOIN companies c ON c.id = d.company_id
    LEFT JOIN vehicle_drivers vd ON vd.driver_id = d.id
    LEFT JOIN vehicles v ON v.id = vd.vehicle_id
    WHERE TRUE
      AND (${filters?.companyId ?? null}::uuid IS NULL OR d.company_id = ${filters?.companyId ?? null}::uuid)
      AND (${filters?.status ?? null} IS NULL OR d.status = ${filters?.status ?? null})
    GROUP BY d.id, c.id
    ORDER BY d.last_name
  `;
  return rows as Driver[];
}

export async function fetchDriver(id: string): Promise<Driver | null> {
  const rows = await sql`
    SELECT d.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(json_build_object(
          'id', vd.id, 'is_primary', vd.is_primary,
          'vehicle', json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model)
        )) FILTER (WHERE vd.id IS NOT NULL), '[]'
      ) AS vehicle_drivers
    FROM drivers d
    LEFT JOIN companies c ON c.id = d.company_id
    LEFT JOIN vehicle_drivers vd ON vd.driver_id = d.id
    LEFT JOIN vehicles v ON v.id = vd.vehicle_id
    WHERE d.id = ${id}
    GROUP BY d.id, c.id
  `;
  return rows[0] ? (rows[0] as Driver) : null;
}

export async function createDriver(driver: DriverInsert): Promise<Driver> {
  const rows = await sql`
    INSERT INTO drivers ${sql(driver as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.DRIVER_CREATE_FAILED);
  return rows[0] as Driver;
}

export async function updateDriver(id: string, updates: DriverUpdate): Promise<Driver> {
  const rows = await sql`
    UPDATE drivers
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.DRIVER_UPDATE_FAILED);
  return rows[0] as Driver;
}

export async function archiveDriver(id: string): Promise<void> {
  await sql`
    UPDATE drivers SET status = 'archived', updated_at = ${new Date().toISOString()} WHERE id = ${id}
  `;
}
