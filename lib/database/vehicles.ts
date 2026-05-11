import sql from '@/lib/db';
import type { Vehicle, VehicleInsert, VehicleUpdate, VehicleFilters } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

const LEASING_RETURN_APPOINTMENT_TYPE_ID = '11111111-1111-1111-1111-111111111008';
const LEASING_COST_TYPE_ID = '33333333-3333-3333-3333-333333333006';

export async function fetchVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  const rows = await sql`
    SELECT v.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', a.id, 'due_date', a.due_date, 'status', a.status,
          'appointment_type', json_build_object('name', at.name, 'color', at.color)
        )) FILTER (WHERE a.id IS NOT NULL), '[]'
      ) AS appointments
    FROM vehicles v
    LEFT JOIN companies c ON c.id = v.company_id
    LEFT JOIN appointments a ON a.vehicle_id = v.id
    LEFT JOIN appointment_types at ON at.id = a.appointment_type_id
    WHERE TRUE
      AND (${filters?.companyId ?? null}::uuid IS NULL OR v.company_id = ${filters?.companyId ?? null}::uuid)
      AND (${filters?.status ?? null} IS NULL OR v.status = ${filters?.status ?? null})
      AND (${filters?.fuelType ?? null} IS NULL OR v.fuel_type = ${filters?.fuelType ?? null}::fuel_type)
      AND (${filters?.search ?? null} IS NULL OR (
        v.license_plate ILIKE ${'%' + (filters?.search ?? '') + '%'} OR
        v.brand ILIKE ${'%' + (filters?.search ?? '') + '%'} OR
        v.model ILIKE ${'%' + (filters?.search ?? '') + '%'}
      ))
    GROUP BY v.id, c.id
    ORDER BY v.license_plate
  `;
  return rows as unknown as Vehicle[];
}

export async function fetchVehicle(id: string): Promise<Vehicle | null> {
  const rows = await sql`
    SELECT v.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', a.id, 'due_date', a.due_date, 'status', a.status, 'notes', a.notes,
          'appointment_type', json_build_object('id', at.id, 'name', at.name, 'color', at.color, 'default_interval_months', at.default_interval_months)
        )) FILTER (WHERE a.id IS NOT NULL), '[]'
      ) AS appointments,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', d.id, 'date', d.date, 'status', d.status, 'description', d.description,
          'damage_type', json_build_object('id', dt.id, 'name', dt.name)
        )) FILTER (WHERE d.id IS NOT NULL), '[]'
      ) AS damages,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', doc.id, 'name', doc.name, 'file_path', doc.file_path,
          'document_type', json_build_object('id', dct.id, 'name', dct.name)
        )) FILTER (WHERE doc.id IS NOT NULL), '[]'
      ) AS documents,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', co.id, 'amount', co.amount, 'date', co.date,
          'cost_type', json_build_object('id', cot.id, 'name', cot.name)
        )) FILTER (WHERE co.id IS NOT NULL), '[]'
      ) AS costs,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', vd.id, 'is_primary', vd.is_primary,
          'driver', json_build_object('id', dr.id, 'first_name', dr.first_name, 'last_name', dr.last_name, 'email', dr.email, 'phone', dr.phone)
        )) FILTER (WHERE vd.id IS NOT NULL), '[]'
      ) AS vehicle_drivers
    FROM vehicles v
    LEFT JOIN companies c ON c.id = v.company_id
    LEFT JOIN appointments a ON a.vehicle_id = v.id
    LEFT JOIN appointment_types at ON at.id = a.appointment_type_id
    LEFT JOIN damages d ON d.vehicle_id = v.id
    LEFT JOIN damage_types dt ON dt.id = d.damage_type_id
    LEFT JOIN documents doc ON doc.vehicle_id = v.id
    LEFT JOIN document_types dct ON dct.id = doc.document_type_id
    LEFT JOIN costs co ON co.vehicle_id = v.id
    LEFT JOIN cost_types cot ON cot.id = co.cost_type_id
    LEFT JOIN vehicle_drivers vd ON vd.vehicle_id = v.id
    LEFT JOIN drivers dr ON dr.id = vd.driver_id
    WHERE v.id = ${id}
    GROUP BY v.id, c.id
  `;
  return rows[0] ? (rows[0] as Vehicle) : null;
}

export async function createVehicle(vehicle: VehicleInsert): Promise<Vehicle> {
  try {
    const rows = await sql`
      INSERT INTO vehicles ${sql(vehicle as Record<string, unknown>)}
      RETURNING *
    `;
    if (!rows[0]) throw new Error(ERROR_MESSAGES.VEHICLE_CREATE_FAILED);
    return rows[0] as Vehicle;
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === '23505') throw new Error(ERROR_MESSAGES.VEHICLE_DUPLICATE_PLATE);
    throw new Error(ERROR_MESSAGES.VEHICLE_CREATE_FAILED);
  }
}

export async function updateVehicle(id: string, updates: VehicleUpdate): Promise<Vehicle> {
  const rows = await sql`
    UPDATE vehicles
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.VEHICLE_UPDATE_FAILED);
  return rows[0] as Vehicle;
}

export async function archiveVehicle(id: string): Promise<void> {
  await sql`
    UPDATE vehicles SET status = 'archived', updated_at = ${new Date().toISOString()} WHERE id = ${id}
  `;
}

export async function deleteVehicle(id: string): Promise<void> {
  await sql`DELETE FROM vehicles WHERE id = ${id}`;
}

export async function syncLeasingAppointment(
  vehicleId: string,
  leasingEndDate: string | null,
  isLeased: boolean
): Promise<void> {
  const existing = await sql`
    SELECT id FROM appointments
    WHERE vehicle_id = ${vehicleId} AND appointment_type_id = ${LEASING_RETURN_APPOINTMENT_TYPE_ID}
    LIMIT 1
  `;

  if (!isLeased || !leasingEndDate) {
    if (existing[0]) {
      await sql`DELETE FROM appointments WHERE id = ${(existing[0] as { id: string }).id}`;
    }
    return;
  }

  if (existing[0]) {
    await sql`
      UPDATE appointments
      SET due_date = ${leasingEndDate}, status = 'pending', updated_at = ${new Date().toISOString()}
      WHERE id = ${(existing[0] as { id: string }).id}
    `;
  } else {
    await sql`
      INSERT INTO appointments (vehicle_id, appointment_type_id, due_date, status, notes)
      VALUES (${vehicleId}, ${LEASING_RETURN_APPOINTMENT_TYPE_ID}, ${leasingEndDate}, 'pending',
              'Automatisch erstellt bei Leasingfahrzeug-Einrichtung')
    `;
  }
}

export async function syncLeasingCost(
  vehicleId: string,
  leasingRate: number | null | undefined,
  isLeased: boolean
): Promise<void> {
  if (!isLeased || !leasingRate || leasingRate <= 0) return;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

  const existing = await sql`
    SELECT id FROM costs
    WHERE vehicle_id = ${vehicleId}
      AND cost_type_id = ${LEASING_COST_TYPE_ID}
      AND date >= ${firstOfMonth}::date
      AND date < ${firstOfNextMonth}::date
    LIMIT 1
  `;

  if (!existing[0]) {
    await sql`
      INSERT INTO costs (vehicle_id, cost_type_id, amount, date, description)
      VALUES (${vehicleId}, ${LEASING_COST_TYPE_ID}, ${leasingRate}, ${firstOfMonth}, 'Monatliche Leasingrate')
    `;
  }
}
