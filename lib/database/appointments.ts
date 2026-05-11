import sql from '@/lib/db';
import type { Appointment, AppointmentInsert, AppointmentUpdate, AppointmentFilters, UpcomingAppointments } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export async function fetchAppointment(id: string): Promise<Appointment> {
  const rows = await sql`
    SELECT a.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', at.id, 'name', at.name, 'color', at.color) AS appointment_type
    FROM appointments a
    JOIN vehicles v ON v.id = a.vehicle_id
    JOIN appointment_types at ON at.id = a.appointment_type_id
    WHERE a.id = ${id}
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.APPOINTMENT_NOT_FOUND);
  return rows[0] as Appointment;
}

export async function fetchAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
  const rows = await sql`
    SELECT a.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', at.id, 'name', at.name, 'color', at.color) AS appointment_type
    FROM appointments a
    JOIN vehicles v ON v.id = a.vehicle_id
    JOIN appointment_types at ON at.id = a.appointment_type_id
    WHERE TRUE
      AND (${filters?.vehicleId ?? null}::uuid IS NULL OR a.vehicle_id = ${filters?.vehicleId ?? null}::uuid)
      AND (${filters?.status ?? null} IS NULL OR a.status = ${filters?.status ?? null})
      AND (${filters?.dueBefore?.toISOString() ?? null} IS NULL OR a.due_date <= ${filters?.dueBefore?.toISOString() ?? null})
      AND (${filters?.dueAfter?.toISOString() ?? null} IS NULL OR a.due_date >= ${filters?.dueAfter?.toISOString() ?? null})
    ORDER BY a.due_date
  `;
  return rows as unknown as Appointment[];
}

export async function fetchUpcomingAppointments(): Promise<UpcomingAppointments> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);

  const rows = await sql`
    SELECT a.*,
      json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle,
      json_build_object('id', at.id, 'name', at.name, 'color', at.color) AS appointment_type
    FROM appointments a
    JOIN vehicles v ON v.id = a.vehicle_id
    JOIN appointment_types at ON at.id = a.appointment_type_id
    WHERE a.status != 'completed'
      AND a.due_date <= ${in30Days.toISOString()}
    ORDER BY a.due_date
  ` as unknown as Appointment[];

  return {
    overdue: rows.filter((a) => new Date(a.due_date) < today),
    urgent: rows.filter((a) => {
      const d = new Date(a.due_date);
      return d >= today && d <= in14Days;
    }),
    upcoming: rows.filter((a) => {
      const d = new Date(a.due_date);
      return d > in14Days && d <= in30Days;
    }),
  };
}

export async function createAppointment(appointment: AppointmentInsert): Promise<Appointment> {
  const rows = await sql`
    INSERT INTO appointments ${sql(appointment as Record<string, unknown>)}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.APPOINTMENT_CREATE_FAILED);
  return rows[0] as Appointment;
}

export async function updateAppointment(id: string, updates: AppointmentUpdate): Promise<Appointment> {
  const rows = await sql`
    UPDATE appointments
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.APPOINTMENT_UPDATE_FAILED);
  return rows[0] as Appointment;
}

export async function completeAppointment(id: string): Promise<void> {
  await sql`
    UPDATE appointments
    SET status = 'completed',
        completed_date = ${new Date().toISOString().split('T')[0]},
        updated_at = ${new Date().toISOString()}
    WHERE id = ${id}
  `;
}

export async function deleteAppointment(id: string): Promise<void> {
  await sql`DELETE FROM appointments WHERE id = ${id}`;
}
