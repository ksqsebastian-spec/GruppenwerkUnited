import sql from '@/lib/db';
import { addMonths, differenceInDays, format } from 'date-fns';
import type {
  LicenseCheckSettings,
  LicenseCheckSettingsUpdate,
  LicenseCheckInspector,
  LicenseCheckInspectorInsert,
  LicenseCheckInspectorUpdate,
  LicenseCheckEmployee,
  LicenseCheckEmployeeInsert,
  LicenseCheckEmployeeUpdate,
  LicenseCheckEmployeeFilters,
  LicenseCheck,
  LicenseCheckInsert,
  LicenseCheckStatus,
  LicenseControlStats,
} from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

export function calculateCheckStatus(nextCheckDue: string | null, warningDays: number): LicenseCheckStatus {
  if (!nextCheckDue) return 'overdue';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextCheckDue); dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(dueDate, today);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warningDays) return 'due_soon';
  return 'ok';
}

export function calculateNextCheckDue(checkDate: string, intervalMonths: number): string {
  return format(addMonths(new Date(checkDate), intervalMonths), 'yyyy-MM-dd');
}

export async function fetchLicenseSettings(): Promise<LicenseCheckSettings> {
  const rows = await sql`SELECT * FROM license_check_settings LIMIT 1`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_SETTINGS_LOAD_FAILED);
  return rows[0] as LicenseCheckSettings;
}

export async function updateLicenseSettings(updates: LicenseCheckSettingsUpdate): Promise<LicenseCheckSettings> {
  const rows = await sql`
    UPDATE license_check_settings
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = '00000000-0000-0000-0000-000000000001'
    RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_SETTINGS_UPDATE_FAILED);
  return rows[0] as LicenseCheckSettings;
}

export async function fetchLicenseInspectors(status?: 'active' | 'archived'): Promise<LicenseCheckInspector[]> {
  const rows = await sql`
    SELECT * FROM license_check_inspectors
    WHERE (${status ?? null} IS NULL OR status = ${status ?? null})
    ORDER BY name
  `;
  return rows as unknown as LicenseCheckInspector[];
}

export async function createLicenseInspector(inspector: LicenseCheckInspectorInsert): Promise<LicenseCheckInspector> {
  const rows = await sql`INSERT INTO license_check_inspectors ${sql(inspector as Record<string, unknown>)} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_CREATE_FAILED);
  return rows[0] as LicenseCheckInspector;
}

export async function updateLicenseInspector(id: string, updates: LicenseCheckInspectorUpdate): Promise<LicenseCheckInspector> {
  const rows = await sql`UPDATE license_check_inspectors SET ${sql(updates as Record<string, unknown>)} WHERE id = ${id} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_UPDATE_FAILED);
  return rows[0] as LicenseCheckInspector;
}

export async function archiveLicenseInspector(id: string): Promise<void> {
  await sql`UPDATE license_check_inspectors SET status = 'archived' WHERE id = ${id}`;
}

export async function fetchLicenseEmployees(filters?: LicenseCheckEmployeeFilters): Promise<LicenseCheckEmployee[]> {
  const settings = await fetchLicenseSettings();
  const search = filters?.search ? `%${filters.search}%` : null;

  const rows = await sql`
    SELECT e.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(json_build_object(
          'id', lc.id, 'check_date', lc.check_date, 'next_check_due', lc.next_check_due,
          'license_verified', lc.license_verified,
          'checked_by', json_build_object('id', li.id, 'name', li.name)
        ) ORDER BY lc.check_date DESC) FILTER (WHERE lc.id IS NOT NULL), '[]'
      ) AS license_checks
    FROM license_check_employees e
    LEFT JOIN companies c ON c.id = e.company_id
    LEFT JOIN license_checks lc ON lc.employee_id = e.id
    LEFT JOIN license_check_inspectors li ON li.id = lc.inspector_id
    WHERE TRUE
      AND (${filters?.companyId ?? null}::uuid IS NULL OR e.company_id = ${filters?.companyId ?? null}::uuid)
      AND (${filters?.status ?? null} IS NULL OR e.status = ${filters?.status ?? null})
      AND (${search} IS NULL OR (
        e.first_name ILIKE ${search} OR e.last_name ILIKE ${search} OR e.personnel_number ILIKE ${search}
      ))
    GROUP BY e.id, c.id
    ORDER BY e.last_name
  `;

  const employees = (rows as unknown as LicenseCheckEmployee[]).map((employee) => {
    const checks = (employee.license_checks as unknown as LicenseCheck[]) || [];
    const latestCheck = checks[0] || null;
    const nextCheckDue = latestCheck?.next_check_due || null;
    return {
      ...employee,
      latest_check: latestCheck,
      next_check_due: nextCheckDue,
      check_status: calculateCheckStatus(nextCheckDue, settings.warning_days_before),
    };
  });

  if (filters?.checkStatus) return employees.filter((e) => e.check_status === filters.checkStatus);
  return employees;
}

export async function fetchLicenseEmployee(id: string): Promise<LicenseCheckEmployee | null> {
  const settings = await fetchLicenseSettings();

  const rows = await sql`
    SELECT e.*,
      json_build_object('id', c.id, 'name', c.name) AS company,
      COALESCE(
        json_agg(json_build_object(
          'id', lc.id, 'check_date', lc.check_date, 'next_check_due', lc.next_check_due,
          'license_verified', lc.license_verified, 'notes', lc.notes, 'created_at', lc.created_at,
          'checked_by', json_build_object('id', li.id, 'name', li.name)
        ) ORDER BY lc.check_date DESC) FILTER (WHERE lc.id IS NOT NULL), '[]'
      ) AS license_checks
    FROM license_check_employees e
    LEFT JOIN companies c ON c.id = e.company_id
    LEFT JOIN license_checks lc ON lc.employee_id = e.id
    LEFT JOIN license_check_inspectors li ON li.id = lc.inspector_id
    WHERE e.id = ${id}
    GROUP BY e.id, c.id
  `;

  if (!rows[0]) return null;
  const employee = rows[0] as LicenseCheckEmployee;
  const checks = (employee.license_checks as unknown as LicenseCheck[]) || [];
  const latestCheck = checks[0] || null;
  const nextCheckDue = latestCheck?.next_check_due || null;
  return {
    ...employee,
    latest_check: latestCheck,
    next_check_due: nextCheckDue,
    check_status: calculateCheckStatus(nextCheckDue, settings.warning_days_before),
  };
}

export async function createLicenseEmployee(employee: LicenseCheckEmployeeInsert): Promise<LicenseCheckEmployee> {
  const rows = await sql`INSERT INTO license_check_employees ${sql(employee as Record<string, unknown>)} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_CREATE_FAILED);
  return rows[0] as LicenseCheckEmployee;
}

export async function updateLicenseEmployee(id: string, updates: LicenseCheckEmployeeUpdate): Promise<LicenseCheckEmployee> {
  const rows = await sql`
    UPDATE license_check_employees
    SET ${sql({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)}
    WHERE id = ${id} RETURNING *
  `;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_UPDATE_FAILED);
  return rows[0] as LicenseCheckEmployee;
}

export async function archiveLicenseEmployee(id: string): Promise<void> {
  await sql`UPDATE license_check_employees SET status = 'archived', updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

export async function fetchLicenseChecks(employeeId: string): Promise<LicenseCheck[]> {
  const rows = await sql`
    SELECT lc.*,
      json_build_object('id', li.id, 'name', li.name, 'email', li.email) AS checked_by,
      COALESCE(
        json_agg(json_build_object('id', d.id, 'name', d.name, 'file_path', d.file_path, 'mime_type', d.mime_type))
        FILTER (WHERE d.id IS NOT NULL), '[]'
      ) AS documents
    FROM license_checks lc
    LEFT JOIN license_check_inspectors li ON li.id = lc.inspector_id
    LEFT JOIN documents d ON d.license_check_id = lc.id
    WHERE lc.employee_id = ${employeeId}
    GROUP BY lc.id, li.id
    ORDER BY lc.check_date DESC
  `;
  return rows as unknown as LicenseCheck[];
}

export async function createLicenseCheck(check: LicenseCheckInsert): Promise<LicenseCheck> {
  const rows = await sql`INSERT INTO license_checks ${sql(check as Record<string, unknown>)} RETURNING *`;
  if (!rows[0]) throw new Error(ERROR_MESSAGES.LICENSE_CHECK_CREATE_FAILED);
  return rows[0] as LicenseCheck;
}

export async function createBatchLicenseChecks(
  employeeIds: string[],
  checkData: Omit<LicenseCheckInsert, 'employee_id'>
): Promise<LicenseCheck[]> {
  const checks = employeeIds.map((employee_id) => ({ ...checkData, employee_id }));
  return sql`INSERT INTO license_checks ${sql(checks as Record<string, unknown>[])} RETURNING *` as Promise<LicenseCheck[]>;
}

export async function deleteLicenseCheck(id: string): Promise<void> {
  await sql`DELETE FROM license_checks WHERE id = ${id}`;
}

export async function fetchLicenseControlStats(): Promise<LicenseControlStats> {
  const employees = await fetchLicenseEmployees({ status: 'active' });
  return {
    totalEmployees: employees.length,
    overdueCount: employees.filter((e) => e.check_status === 'overdue').length,
    dueSoonCount: employees.filter((e) => e.check_status === 'due_soon').length,
    okCount: employees.filter((e) => e.check_status === 'ok').length,
  };
}

export async function fetchLicenseWarningCount(): Promise<number> {
  const employees = await fetchLicenseEmployees({ status: 'active' });
  return employees.filter((e) => e.check_status === 'overdue' || e.check_status === 'due_soon').length;
}
