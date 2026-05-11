import sql from '@/lib/db';
import { addMonths, differenceInDays, format } from 'date-fns';
import type {
  UvvSettings,
  UvvSettingsUpdate,
  UvvInstructor,
  UvvInstructorInsert,
  UvvInstructorUpdate,
  UvvCheck,
  UvvCheckInsert,
  UvvCheckStatus,
  UvvControlStats,
  DriverWithUvvStatus,
  UvvDriverFilters,
} from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export function calculateUvvCheckStatus(nextCheckDue: string | null, warningDays: number): UvvCheckStatus {
  if (!nextCheckDue) return 'overdue';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextCheckDue); dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(dueDate, today);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warningDays) return 'due_soon';
  return 'ok';
}

export function calculateNextUvvCheckDue(checkDate: string, intervalMonths: number): string {
  return format(addMonths(new Date(checkDate), intervalMonths), 'yyyy-MM-dd');
}

export async function fetchUvvSettings(): Promise<UvvSettings> {
  const rows = await sql`SELECT * FROM uvv_settings LIMIT 1`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.UVV_SETTINGS_LOAD_FAILED);
  return rows[0] as UvvSettings;
}

export async function updateUvvSettings(updates: UvvSettingsUpdate): Promise<UvvSettings> {
  const rows = await sql`
    UPDATE uvv_settings
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = '00000000-0000-0000-0000-000000000002'
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.UVV_SETTINGS_UPDATE_FAILED);
  return rows[0] as UvvSettings;
}

export async function fetchUvvInstructors(status?: 'active' | 'archived'): Promise<UvvInstructor[]> {
  const rows = await sql`
    SELECT * FROM uvv_instructors
    WHERE (${status ?? null} IS NULL OR status = ${status ?? null})
    ORDER BY name
  `;
  return rows as UvvInstructor[];
}

export async function createUvvInstructor(instructor: UvvInstructorInsert): Promise<UvvInstructor> {
  const rows = await sql`INSERT INTO uvv_instructors ${sql(instructor as Record<string, unknown>)} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.UVV_INSTRUCTOR_CREATE_FAILED);
  return rows[0] as UvvInstructor;
}

export async function updateUvvInstructor(id: string, updates: UvvInstructorUpdate): Promise<UvvInstructor> {
  const rows = await sql`UPDATE uvv_instructors SET ${sql(updates as Record<string, unknown>)} WHERE id = ${id} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.UVV_INSTRUCTOR_UPDATE_FAILED);
  return rows[0] as UvvInstructor;
}

export async function archiveUvvInstructor(id: string): Promise<void> {
  await sql`UPDATE uvv_instructors SET status = 'archived' WHERE id = ${id}`;
}

export async function fetchDriversWithUvvStatus(filters?: UvvDriverFilters): Promise<DriverWithUvvStatus[]> {
  const settings = await fetchUvvSettings();
  const search = filters?.search ? `%${filters.search}%` : null;

  const rows = await sql`
    SELECT d.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(json_build_object(
          'id', uc.id, 'check_date', uc.check_date, 'next_check_due', uc.next_check_due,
          'topics', uc.topics, 'notes', uc.notes,
          'instructed_by', json_build_object('id', ui.id, 'name', ui.name)
        ) ORDER BY uc.check_date DESC) FILTER (WHERE uc.id IS NOT NULL), '[]'
      ) AS uvv_checks
    FROM drivers d
    LEFT JOIN companies c ON c.id = d.company_id
    LEFT JOIN uvv_checks uc ON uc.driver_id = d.id
    LEFT JOIN uvv_instructors ui ON ui.id = uc.instructor_id
    WHERE TRUE
      AND (${filters?.companyId ?? null}::uuid IS NULL OR d.company_id = ${filters?.companyId ?? null}::uuid)
      AND (${filters?.status ?? null} IS NULL OR d.status = ${filters?.status ?? null})
      AND (${search} IS NULL OR (d.first_name ILIKE ${search} OR d.last_name ILIKE ${search}))
    GROUP BY d.id, c.id
    ORDER BY d.last_name
  `;

  const drivers = (rows as DriverWithUvvStatus[]).map((driver) => {
    const checks = (driver.uvv_checks as UvvCheck[]) || [];
    const latestCheck = checks[0] || null;
    const nextUvvDue = latestCheck?.next_check_due || null;
    return {
      ...driver,
      latest_uvv_check: latestCheck,
      next_uvv_due: nextUvvDue,
      uvv_status: calculateUvvCheckStatus(nextUvvDue, settings.warning_days_before),
    };
  });

  if (filters?.uvvStatus) return drivers.filter((d) => d.uvv_status === filters.uvvStatus);
  return drivers;
}

export async function fetchDriverWithUvvStatus(id: string): Promise<DriverWithUvvStatus | null> {
  const settings = await fetchUvvSettings();

  const rows = await sql`
    SELECT d.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(json_build_object(
          'id', uc.id, 'check_date', uc.check_date, 'next_check_due', uc.next_check_due,
          'topics', uc.topics, 'notes', uc.notes, 'created_at', uc.created_at,
          'instructed_by', json_build_object('id', ui.id, 'name', ui.name, 'email', ui.email)
        ) ORDER BY uc.check_date DESC) FILTER (WHERE uc.id IS NOT NULL), '[]'
      ) AS uvv_checks
    FROM drivers d
    LEFT JOIN companies c ON c.id = d.company_id
    LEFT JOIN uvv_checks uc ON uc.driver_id = d.id
    LEFT JOIN uvv_instructors ui ON ui.id = uc.instructor_id
    WHERE d.id = ${id}
    GROUP BY d.id, c.id
  `;

  if (!rows[0]) return null;
  const driver = rows[0] as DriverWithUvvStatus;
  const checks = (driver.uvv_checks as UvvCheck[]) || [];
  const latestCheck = checks[0] || null;
  const nextUvvDue = latestCheck?.next_check_due || null;
  return {
    ...driver,
    latest_uvv_check: latestCheck,
    next_uvv_due: nextUvvDue,
    uvv_status: calculateUvvCheckStatus(nextUvvDue, settings.warning_days_before),
  };
}

export async function fetchUvvChecks(driverId: string): Promise<UvvCheck[]> {
  const rows = await sql`
    SELECT uc.*,
      json_build_object('id', ui.id, 'name', ui.name, 'email', ui.email) AS instructed_by,
      COALESCE(
        json_agg(json_build_object('id', d.id, 'name', d.name, 'file_path', d.file_path, 'mime_type', d.mime_type))
        FILTER (WHERE d.id IS NOT NULL), '[]'
      ) AS documents
    FROM uvv_checks uc
    LEFT JOIN uvv_instructors ui ON ui.id = uc.instructor_id
    LEFT JOIN documents d ON d.uvv_check_id = uc.id
    WHERE uc.driver_id = ${driverId}
    GROUP BY uc.id, ui.id
    ORDER BY uc.check_date DESC
  `;
  return rows as UvvCheck[];
}

export async function createUvvCheck(check: UvvCheckInsert): Promise<UvvCheck> {
  const rows = await sql`INSERT INTO uvv_checks ${sql(check as Record<string, unknown>)} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.UVV_CHECK_CREATE_FAILED);
  return rows[0] as UvvCheck;
}

export async function createBatchUvvChecks(
  driverIds: string[],
  checkData: Omit<UvvCheckInsert, 'driver_id'>
): Promise<UvvCheck[]> {
  const checks = driverIds.map((driver_id) => ({ ...checkData, driver_id }));
  return sql`INSERT INTO uvv_checks ${sql(checks as Record<string, unknown>[])} RETURNING *` as Promise<UvvCheck[]>;
}

export async function deleteUvvCheck(id: string): Promise<void> {
  await sql`DELETE FROM uvv_checks WHERE id = ${id}`;
}

export async function fetchUvvControlStats(): Promise<UvvControlStats> {
  const drivers = await fetchDriversWithUvvStatus({ status: 'active' });
  return {
    totalDrivers: drivers.length,
    overdueCount: drivers.filter((d) => d.uvv_status === 'overdue').length,
    dueSoonCount: drivers.filter((d) => d.uvv_status === 'due_soon').length,
    okCount: drivers.filter((d) => d.uvv_status === 'ok').length,
  };
}

export async function fetchUvvWarningCount(): Promise<number> {
  const drivers = await fetchDriversWithUvvStatus({ status: 'active' });
  return drivers.filter((d) => d.uvv_status === 'overdue' || d.uvv_status === 'due_soon').length;
}
