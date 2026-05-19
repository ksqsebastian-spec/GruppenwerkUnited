/**
 * Führerschein-Kontrollen + Fahrer-mit-Status für die Führerscheinkontrolle.
 */

import { supabase } from '@/lib/supabase/client';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import { calculateCheckStatus } from './license-control-helpers';
import { fetchLicenseSettings } from './license-control-settings';
import type {
  LicenseCheck,
  LicenseCheckInsert,
  LicenseControlStats,
  DriverWithLicenseStatus,
  LicenseDriverFilters,
  Driver,
} from '@/types';

const DRIVER_WITH_CHECKS_SELECT = `
  id, first_name, last_name, email, phone, license_class, license_expiry,
  company_id, status, notes, is_license_inspector, is_uvv_instructor, created_at, updated_at,
  company:companies(id, name),
  license_checks(
    id, employee_id, driver_id, check_date, next_check_due, license_verified, checked_by_id, notes, created_at,
    checked_by:license_check_inspectors(id, name)
  )
`;

const CHECK_WITH_RELATIONS = `
  *,
  checked_by:license_check_inspectors(id, name, email),
  documents(id, name, file_path, mime_type)
`;

/**
 * Lädt alle Fahrer mit Führerscheinkontroll-Status.
 */
export async function fetchDriversWithLicenseStatus(
  filters?: LicenseDriverFilters
): Promise<DriverWithLicenseStatus[]> {
  const settings = await fetchLicenseSettings();

  let query = supabase
    .from('drivers')
    .select(DRIVER_WITH_CHECKS_SELECT)
    .order('last_name');

  if (filters?.companyId) query = query.eq('company_id', filters.companyId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Fahrer:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_LOAD_FAILED);
  }

  type DriverRow = DriverWithLicenseStatus & { license_checks?: LicenseCheck[] };
  const drivers = ((data ?? []) as unknown as DriverRow[]).map((driver) => {
    const sortedChecks = [...(driver.license_checks || [])].sort(
      (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
    );
    const latestCheck = sortedChecks[0] || null;
    const nextCheckDue = latestCheck?.next_check_due || null;
    const checkStatus = calculateCheckStatus(nextCheckDue, settings.warning_days_before);

    return {
      ...driver,
      latest_license_check: latestCheck,
      next_check_due: nextCheckDue,
      check_status: checkStatus,
    } as DriverWithLicenseStatus;
  });

  if (filters?.checkStatus) {
    return drivers.filter((d) => d.check_status === filters.checkStatus);
  }

  return drivers;
}

/**
 * Aktualisiert das Prüfer-Flag eines Fahrers.
 */
export async function updateDriverInspectorFlag(
  driverId: string,
  isInspector: boolean
): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .update({ is_license_inspector: isInspector, updated_at: new Date().toISOString() })
    .eq('id', driverId)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Prüfer-Flags:', error);
    throw new Error('Prüfer-Status konnte nicht aktualisiert werden');
  }

  return data;
}

export async function fetchLicenseChecksByDriver(driverId: string): Promise<LicenseCheck[]> {
  const { data, error } = await supabase
    .from('license_checks')
    .select(CHECK_WITH_RELATIONS)
    .eq('driver_id', driverId)
    .order('check_date', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Kontrollen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_LOAD_FAILED);
  }

  return data ?? [];
}

export async function fetchLicenseChecks(employeeId: string): Promise<LicenseCheck[]> {
  const { data, error } = await supabase
    .from('license_checks')
    .select(CHECK_WITH_RELATIONS)
    .eq('employee_id', employeeId)
    .order('check_date', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Kontrollen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_LOAD_FAILED);
  }

  return data ?? [];
}

export async function createLicenseCheck(check: LicenseCheckInsert): Promise<LicenseCheck> {
  const { data, error } = await supabase
    .from('license_checks')
    .insert(check)
    .select(`
      *,
      checked_by:license_check_inspectors(id, name)
    `)
    .single();

  if (error) {
    console.error('Fehler beim Erstellen der Kontrolle:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_CREATE_FAILED);
  }

  return data;
}

/**
 * Erstellt Kontrollen für mehrere Fahrer (Sammelkontrolle).
 */
export async function createBatchLicenseChecks(
  driverIds: string[],
  checkData: Omit<LicenseCheckInsert, 'driver_id' | 'employee_id'>
): Promise<LicenseCheck[]> {
  const checks = driverIds.map((driverId) => ({
    ...checkData,
    driver_id: driverId,
    employee_id: null,
  }));

  const { data, error } = await supabase
    .from('license_checks')
    .insert(checks)
    .select(`
      *,
      checked_by:license_check_inspectors(id, name)
    `);

  if (error) {
    console.error('Fehler beim Erstellen der Sammelkontrolle:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_CREATE_FAILED);
  }

  return data ?? [];
}

export async function deleteLicenseCheck(id: string): Promise<void> {
  const { error } = await supabase
    .from('license_checks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen der Kontrolle:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_DELETE_FAILED);
  }
}

/**
 * Statistik-Aggregation. Lädt alle aktiven Fahrer einmal und zählt die Buckets.
 * Wenn companyId gesetzt ist, werden nur Fahrer dieser Firma berücksichtigt.
 */
export async function fetchLicenseControlStats(companyId?: string): Promise<LicenseControlStats> {
  const drivers = await fetchDriversWithLicenseStatus({ status: 'active', companyId });

  return {
    totalEmployees: drivers.length,
    overdueCount: drivers.filter((d) => d.check_status === 'overdue').length,
    dueSoonCount: drivers.filter((d) => d.check_status === 'due_soon').length,
    okCount: drivers.filter((d) => d.check_status === 'ok').length,
  };
}

/**
 * Zählt Fahrer mit fälligen/überfälligen Kontrollen (für Sidebar-Badge).
 * Wenn companyId gesetzt ist, werden nur Fahrer dieser Firma berücksichtigt.
 */
export async function fetchLicenseWarningCount(companyId?: string): Promise<number> {
  const drivers = await fetchDriversWithLicenseStatus({ status: 'active', companyId });
  return drivers.filter(
    (d) => d.check_status === 'overdue' || d.check_status === 'due_soon'
  ).length;
}
