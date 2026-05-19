import { supabase } from '@/lib/supabase/client';
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
  DriverWithLicenseStatus,
  LicenseDriverFilters,
  Driver,
} from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

// ============================================================================
// Hilfsfunktionen
// ============================================================================

/**
 * Berechnet den Kontrollstatus eines Mitarbeiters
 */
export function calculateCheckStatus(
  nextCheckDue: string | null,
  warningDays: number
): LicenseCheckStatus {
  if (!nextCheckDue) return 'overdue';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextCheckDue);
  dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(dueDate, today);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warningDays) return 'due_soon';
  return 'ok';
}

/**
 * Berechnet das nächste Kontrolldatum basierend auf dem Intervall
 */
export function calculateNextCheckDue(checkDate: string, intervalMonths: number): string {
  const date = new Date(checkDate);
  const nextDate = addMonths(date, intervalMonths);
  return format(nextDate, 'yyyy-MM-dd');
}

// ============================================================================
// Einstellungen
// ============================================================================

/**
 * Lädt die Führerscheinkontrolle-Einstellungen
 */
export async function fetchLicenseSettings(): Promise<LicenseCheckSettings> {
  const { data, error } = await supabase
    .from('license_check_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_SETTINGS_LOAD_FAILED);
  }

  return data;
}

/**
 * Aktualisiert die Führerscheinkontrolle-Einstellungen
 */
export async function updateLicenseSettings(
  updates: LicenseCheckSettingsUpdate
): Promise<LicenseCheckSettings> {
  const { data, error } = await supabase
    .from('license_check_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_SETTINGS_UPDATE_FAILED);
  }

  return data;
}

// ============================================================================
// Prüfer
// ============================================================================

/**
 * Lädt alle Prüfer
 */
export async function fetchLicenseInspectors(
  status?: 'active' | 'archived'
): Promise<LicenseCheckInspector[]> {
  let query = supabase
    .from('license_check_inspectors')
    .select('*')
    .order('name');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Prüfer:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Erstellt einen neuen Prüfer
 */
export async function createLicenseInspector(
  inspector: LicenseCheckInspectorInsert
): Promise<LicenseCheckInspector> {
  const { data, error } = await supabase
    .from('license_check_inspectors')
    .insert(inspector)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Prüfers:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_CREATE_FAILED);
  }

  return data;
}

/**
 * Aktualisiert einen Prüfer
 */
export async function updateLicenseInspector(
  id: string,
  updates: LicenseCheckInspectorUpdate
): Promise<LicenseCheckInspector> {
  const { data, error } = await supabase
    .from('license_check_inspectors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Prüfers:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_UPDATE_FAILED);
  }

  return data;
}

/**
 * Archiviert einen Prüfer
 */
export async function archiveLicenseInspector(id: string): Promise<void> {
  const { error } = await supabase
    .from('license_check_inspectors')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Prüfers:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_INSPECTOR_DELETE_FAILED);
  }
}

// ============================================================================
// Mitarbeiter
// ============================================================================

/**
 * Lädt alle Mitarbeiter mit Status-Berechnung
 */
export async function fetchLicenseEmployees(
  filters?: LicenseCheckEmployeeFilters
): Promise<LicenseCheckEmployee[]> {
  // Zuerst Einstellungen laden für Warntage
  const settings = await fetchLicenseSettings();

  let query = supabase
    .from('license_check_employees')
    .select(`
      *,
      company:companies(id, name),
      license_checks(
        id,
        check_date,
        next_check_due,
        license_verified,
        checked_by:license_check_inspectors(id, name)
      )
    `)
    .order('last_name');

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,personnel_number.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Mitarbeiter:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_LOAD_FAILED);
  }

  // Status für jeden Mitarbeiter berechnen
  const employees = (data ?? []).map((employee) => {
    // Sortiere Kontrollen nach Datum (neueste zuerst)
    const sortedChecks = [...(employee.license_checks || [])].sort(
      (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
    );
    const latestCheck = sortedChecks[0] || null;
    const nextCheckDue = latestCheck?.next_check_due || null;
    const checkStatus = calculateCheckStatus(nextCheckDue, settings.warning_days_before);

    return {
      ...employee,
      latest_check: latestCheck,
      next_check_due: nextCheckDue,
      check_status: checkStatus,
    };
  });

  // Nach Status filtern falls angegeben
  if (filters?.checkStatus) {
    return employees.filter((e) => e.check_status === filters.checkStatus);
  }

  return employees;
}

/**
 * Lädt einen einzelnen Mitarbeiter
 */
export async function fetchLicenseEmployee(id: string): Promise<LicenseCheckEmployee | null> {
  const settings = await fetchLicenseSettings();

  const { data, error } = await supabase
    .from('license_check_employees')
    .select(`
      *,
      company:companies(id, name),
      license_checks(
        id,
        check_date,
        next_check_due,
        license_verified,
        notes,
        created_at,
        checked_by:license_check_inspectors(id, name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Mitarbeiters:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_NOT_FOUND);
  }

  // Status berechnen
  const sortedChecks = [...(data.license_checks || [])].sort(
    (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
  );
  const latestCheck = sortedChecks[0] || null;
  const nextCheckDue = latestCheck?.next_check_due || null;
  const checkStatus = calculateCheckStatus(nextCheckDue, settings.warning_days_before);

  return {
    ...data,
    license_checks: sortedChecks,
    latest_check: latestCheck,
    next_check_due: nextCheckDue,
    check_status: checkStatus,
  };
}

/**
 * Erstellt einen neuen Mitarbeiter
 */
export async function createLicenseEmployee(
  employee: LicenseCheckEmployeeInsert
): Promise<LicenseCheckEmployee> {
  const { data, error } = await supabase
    .from('license_check_employees')
    .insert(employee)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Mitarbeiters:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_CREATE_FAILED);
  }

  return data;
}

/**
 * Aktualisiert einen Mitarbeiter
 */
export async function updateLicenseEmployee(
  id: string,
  updates: LicenseCheckEmployeeUpdate
): Promise<LicenseCheckEmployee> {
  const { data, error } = await supabase
    .from('license_check_employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Mitarbeiters:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_UPDATE_FAILED);
  }

  return data;
}

/**
 * Archiviert einen Mitarbeiter
 */
export async function archiveLicenseEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('license_check_employees')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Mitarbeiters:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_ARCHIVE_FAILED);
  }
}

// ============================================================================
// Kontrollen
// ============================================================================

/**
 * Lädt alle Fahrer mit Führerscheinkontroll-Status
 */
export async function fetchDriversWithLicenseStatus(
  filters?: LicenseDriverFilters
): Promise<DriverWithLicenseStatus[]> {
  const settings = await fetchLicenseSettings();

  let query = supabase
    .from('drivers')
    .select(`
      *,
      company:companies(id, name),
      license_checks(
        id,
        check_date,
        next_check_due,
        license_verified,
        notes,
        checked_by:license_check_inspectors(id, name)
      )
    `)
    .order('last_name');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

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

  const drivers = (data ?? []).map((driver) => {
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
 * Aktualisiert das Prüfer-Flag eines Fahrers
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

/**
 * Lädt alle Kontrollen für einen Fahrer (inkl. Dokumente)
 */
export async function fetchLicenseChecksByDriver(driverId: string): Promise<LicenseCheck[]> {
  const { data, error } = await supabase
    .from('license_checks')
    .select(`
      *,
      checked_by:license_check_inspectors(id, name, email),
      documents(id, name, file_path, mime_type)
    `)
    .eq('driver_id', driverId)
    .order('check_date', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Kontrollen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Lädt alle Kontrollen für einen Mitarbeiter (inkl. Dokumente)
 */
export async function fetchLicenseChecks(employeeId: string): Promise<LicenseCheck[]> {
  const { data, error } = await supabase
    .from('license_checks')
    .select(`
      *,
      checked_by:license_check_inspectors(id, name, email),
      documents(id, name, file_path, mime_type)
    `)
    .eq('employee_id', employeeId)
    .order('check_date', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Kontrollen:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_CHECK_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Erstellt eine neue Kontrolle
 */
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
 * Erstellt Kontrollen für mehrere Fahrer (Sammelkontrolle)
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

/**
 * Löscht eine Kontrolle
 */
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

// ============================================================================
// Statistiken & Dashboard
// ============================================================================

/**
 * Lädt Statistiken für das Führerscheinkontrolle-Dashboard
 */
export async function fetchLicenseControlStats(): Promise<LicenseControlStats> {
  const drivers = await fetchDriversWithLicenseStatus({ status: 'active' });

  const stats: LicenseControlStats = {
    totalEmployees: drivers.length,
    overdueCount: drivers.filter((d) => d.check_status === 'overdue').length,
    dueSoonCount: drivers.filter((d) => d.check_status === 'due_soon').length,
    okCount: drivers.filter((d) => d.check_status === 'ok').length,
  };

  return stats;
}

/**
 * Lädt die Anzahl der Fahrer mit fälligen/überfälligen Kontrollen
 * Wird für das Sidebar-Badge verwendet
 */
export async function fetchLicenseWarningCount(): Promise<number> {
  const drivers = await fetchDriversWithLicenseStatus({ status: 'active' });
  return drivers.filter(
    (d) => d.check_status === 'overdue' || d.check_status === 'due_soon'
  ).length;
}
