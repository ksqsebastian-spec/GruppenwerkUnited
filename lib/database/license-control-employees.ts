/**
 * Mitarbeiter-CRUD und -Status-Berechnung für die Führerscheinkontrolle.
 */

import { supabase } from '@/lib/supabase/client';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import { calculateCheckStatus } from './license-control-helpers';
import { fetchLicenseSettings } from './license-control-settings';
import type {
  LicenseCheckEmployee,
  LicenseCheckEmployeeInsert,
  LicenseCheckEmployeeUpdate,
  LicenseCheckEmployeeFilters,
} from '@/types';

const EMPLOYEE_LIST_SELECT = `
  id, first_name, last_name, personnel_number, email, license_classes, license_number, license_expiry_date,
  status, company_id, notes, created_at, updated_at,
  company:companies(id, name),
  license_checks(
    id, employee_id, driver_id, check_date, next_check_due, license_verified, checked_by_id, notes, created_at,
    checked_by:license_check_inspectors(id, name)
  )
`;

const EMPLOYEE_DETAIL_SELECT = `
  id, first_name, last_name, personnel_number, email, license_classes, license_number, license_expiry_date,
  status, company_id, notes, created_at, updated_at,
  company:companies(id, name),
  license_checks(
    id, employee_id, driver_id, check_date, next_check_due, license_verified, checked_by_id, notes, created_at,
    checked_by:license_check_inspectors(id, name)
  )
`;

export async function fetchLicenseEmployees(
  filters?: LicenseCheckEmployeeFilters
): Promise<LicenseCheckEmployee[]> {
  // Warntage werden aus den Einstellungen geladen — nur 1× pro Aufruf, nicht pro Mitarbeiter.
  const settings = await fetchLicenseSettings();

  let query = supabase
    .from('license_check_employees')
    .select(EMPLOYEE_LIST_SELECT)
    .order('last_name');

  if (filters?.companyId) query = query.eq('company_id', filters.companyId);
  if (filters?.status) query = query.eq('status', filters.status);
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

  const employees = ((data ?? []) as unknown as LicenseCheckEmployee[]).map((employee) => {
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

  if (filters?.checkStatus) {
    return employees.filter((e) => e.check_status === filters.checkStatus);
  }

  return employees;
}

export async function fetchLicenseEmployee(id: string): Promise<LicenseCheckEmployee | null> {
  const settings = await fetchLicenseSettings();

  const { data, error } = await supabase
    .from('license_check_employees')
    .select(EMPLOYEE_DETAIL_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Mitarbeiters:', error);
    throw new Error(ERROR_MESSAGES.LICENSE_EMPLOYEE_NOT_FOUND);
  }

  const employee = data as unknown as LicenseCheckEmployee;
  const sortedChecks = [...(employee.license_checks || [])].sort(
    (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
  );
  const latestCheck = sortedChecks[0] || null;
  const nextCheckDue = latestCheck?.next_check_due || null;
  const checkStatus = calculateCheckStatus(nextCheckDue, settings.warning_days_before);

  return {
    ...employee,
    license_checks: sortedChecks,
    latest_check: latestCheck,
    next_check_due: nextCheckDue,
    check_status: checkStatus,
  };
}

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

/**
 * Prüft ob ein Mitarbeiter zur angegebenen Firma gehört.
 */
export async function assertLicenseEmployeeInScope(
  employeeId: string,
  tenantCompanyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('license_check_employees')
    .select('id')
    .eq('id', employeeId)
    .eq('company_id', tenantCompanyId)
    .maybeSingle();
  if (error) {
    console.error('Fehler beim Prüfen des Mitarbeiter-Scopes:', error);
    return false;
  }
  return !!data;
}

/**
 * Prüft ob ALLE Mitarbeiter in der Liste zur angegebenen Firma gehören.
 */
export async function assertLicenseEmployeesInScope(
  employeeIds: string[],
  tenantCompanyId: string
): Promise<boolean> {
  if (employeeIds.length === 0) return true;
  const { data, error } = await supabase
    .from('license_check_employees')
    .select('id')
    .in('id', employeeIds)
    .eq('company_id', tenantCompanyId);
  if (error) {
    console.error('Fehler beim Prüfen des Mitarbeiter-Scopes:', error);
    return false;
  }
  return (data?.length ?? 0) === employeeIds.length;
}
