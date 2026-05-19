import { supabase } from '@/lib/supabase/client';
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
  Driver,
} from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

// ============================================================================
// Hilfsfunktionen
// ============================================================================

/**
 * Berechnet den UVV-Status eines Fahrers
 */
export function calculateUvvCheckStatus(
  nextCheckDue: string | null,
  warningDays: number
): UvvCheckStatus {
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
 * Berechnet das nächste UVV-Kontrolldatum basierend auf dem Intervall
 */
export function calculateNextUvvCheckDue(checkDate: string, intervalMonths: number): string {
  const date = new Date(checkDate);
  const nextDate = addMonths(date, intervalMonths);
  return format(nextDate, 'yyyy-MM-dd');
}

// ============================================================================
// Einstellungen
// ============================================================================

/**
 * Lädt die UVV-Einstellungen
 */
export async function fetchUvvSettings(): Promise<UvvSettings> {
  const { data, error } = await supabase
    .from('uvv_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Fehler beim Laden der UVV-Einstellungen:', error);
    throw new Error(ERROR_MESSAGES.UVV_SETTINGS_LOAD_FAILED);
  }

  return data;
}

/**
 * Aktualisiert die UVV-Einstellungen
 */
export async function updateUvvSettings(
  updates: UvvSettingsUpdate
): Promise<UvvSettings> {
  const { data, error } = await supabase
    .from('uvv_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000002')
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der UVV-Einstellungen:', error);
    throw new Error(ERROR_MESSAGES.UVV_SETTINGS_UPDATE_FAILED);
  }

  return data;
}

// ============================================================================
// Unterweisende
// ============================================================================

/**
 * Lädt alle Unterweisenden
 */
export async function fetchUvvInstructors(
  status?: 'active' | 'archived'
): Promise<UvvInstructor[]> {
  let query = supabase
    .from('uvv_instructors')
    .select('*')
    .order('name');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Unterweisenden:', error);
    throw new Error(ERROR_MESSAGES.UVV_INSTRUCTOR_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Erstellt einen neuen Unterweisenden
 */
export async function createUvvInstructor(
  instructor: UvvInstructorInsert
): Promise<UvvInstructor> {
  const { data, error } = await supabase
    .from('uvv_instructors')
    .insert(instructor)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Unterweisenden:', error);
    throw new Error(ERROR_MESSAGES.UVV_INSTRUCTOR_CREATE_FAILED);
  }

  return data;
}

/**
 * Aktualisiert einen Unterweisenden
 */
export async function updateUvvInstructor(
  id: string,
  updates: UvvInstructorUpdate
): Promise<UvvInstructor> {
  const { data, error } = await supabase
    .from('uvv_instructors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Unterweisenden:', error);
    throw new Error(ERROR_MESSAGES.UVV_INSTRUCTOR_UPDATE_FAILED);
  }

  return data;
}

/**
 * Archiviert einen Unterweisenden
 */
export async function archiveUvvInstructor(id: string): Promise<void> {
  const { error } = await supabase
    .from('uvv_instructors')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Unterweisenden:', error);
    throw new Error(ERROR_MESSAGES.UVV_INSTRUCTOR_DELETE_FAILED);
  }
}

// ============================================================================
// Fahrer mit UVV-Status
// ============================================================================

/**
 * Lädt alle Fahrer mit UVV-Status-Berechnung
 */
export async function fetchDriversWithUvvStatus(
  filters?: UvvDriverFilters
): Promise<DriverWithUvvStatus[]> {
  // Zuerst Einstellungen laden für Warntage
  const settings = await fetchUvvSettings();

  // Fahrer laden mit UVV-Checks
  let query = supabase
    .from('drivers')
    .select(`
      *,
      company:companies(id, name),
      uvv_checks(
        id,
        check_date,
        next_check_due,
        topics,
        notes,
        instructed_by:uvv_instructors(id, name)
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
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Fahrer:', error);
    throw new Error('Fahrer konnten nicht geladen werden');
  }

  // Status für jeden Fahrer berechnen
  const drivers = (data ?? []).map((driver) => {
    // Sortiere UVV-Checks nach Datum (neueste zuerst)
    const sortedChecks = [...(driver.uvv_checks || [])].sort(
      (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
    );
    const latestCheck = sortedChecks[0] || null;
    const nextUvvDue = latestCheck?.next_check_due || null;
    const uvvStatus = calculateUvvCheckStatus(nextUvvDue, settings.warning_days_before);

    return {
      ...driver,
      latest_uvv_check: latestCheck,
      next_uvv_due: nextUvvDue,
      uvv_status: uvvStatus,
    } as DriverWithUvvStatus;
  });

  // Nach UVV-Status filtern falls angegeben
  if (filters?.uvvStatus) {
    return drivers.filter((d) => d.uvv_status === filters.uvvStatus);
  }

  return drivers;
}

/**
 * Lädt einen einzelnen Fahrer mit UVV-Status
 */
export async function fetchDriverWithUvvStatus(id: string): Promise<DriverWithUvvStatus | null> {
  const settings = await fetchUvvSettings();

  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      company:companies(id, name),
      uvv_checks(
        id,
        check_date,
        next_check_due,
        topics,
        notes,
        created_at,
        instructed_by:uvv_instructors(id, name, email)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Fahrers:', error);
    throw new Error('Fahrer konnte nicht geladen werden');
  }

  // Status berechnen
  const sortedChecks = [...(data.uvv_checks || [])].sort(
    (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
  );
  const latestCheck = sortedChecks[0] || null;
  const nextUvvDue = latestCheck?.next_check_due || null;
  const uvvStatus = calculateUvvCheckStatus(nextUvvDue, settings.warning_days_before);

  return {
    ...data,
    uvv_checks: sortedChecks,
    latest_uvv_check: latestCheck,
    next_uvv_due: nextUvvDue,
    uvv_status: uvvStatus,
  } as DriverWithUvvStatus;
}

// ============================================================================
// UVV-Unterweisungen
// ============================================================================

/**
 * Lädt alle UVV-Unterweisungen für einen Fahrer (inkl. Dokumente)
 */
export async function fetchUvvChecks(driverId: string): Promise<UvvCheck[]> {
  const { data, error } = await supabase
    .from('uvv_checks')
    .select(`
      *,
      instructed_by:uvv_instructors(id, name, email),
      documents(id, name, file_path, mime_type)
    `)
    .eq('driver_id', driverId)
    .order('check_date', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der UVV-Unterweisungen:', error);
    throw new Error(ERROR_MESSAGES.UVV_CHECK_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Erstellt eine neue UVV-Unterweisung
 */
export async function createUvvCheck(check: UvvCheckInsert): Promise<UvvCheck> {
  const { data, error } = await supabase
    .from('uvv_checks')
    .insert(check)
    .select(`
      *,
      instructed_by:uvv_instructors(id, name)
    `)
    .single();

  if (error) {
    console.error('Fehler beim Erstellen der UVV-Unterweisung:', error);
    throw new Error(ERROR_MESSAGES.UVV_CHECK_CREATE_FAILED);
  }

  return data;
}

/**
 * Erstellt UVV-Unterweisungen für mehrere Fahrer (Sammel-Unterweisung)
 */
export async function createBatchUvvChecks(
  driverIds: string[],
  checkData: Omit<UvvCheckInsert, 'driver_id'>
): Promise<UvvCheck[]> {
  const checks = driverIds.map((driverId) => ({
    ...checkData,
    driver_id: driverId,
  }));

  const { data, error } = await supabase
    .from('uvv_checks')
    .insert(checks)
    .select(`
      *,
      instructed_by:uvv_instructors(id, name)
    `);

  if (error) {
    console.error('Fehler beim Erstellen der Sammel-Unterweisung:', error);
    throw new Error(ERROR_MESSAGES.UVV_CHECK_CREATE_FAILED);
  }

  return data ?? [];
}

/**
 * Löscht eine UVV-Unterweisung
 */
export async function deleteUvvCheck(id: string): Promise<void> {
  const { error } = await supabase
    .from('uvv_checks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen der UVV-Unterweisung:', error);
    throw new Error(ERROR_MESSAGES.UVV_CHECK_DELETE_FAILED);
  }
}

// ============================================================================
// Statistiken & Dashboard
// ============================================================================

/**
 * Lädt Statistiken für das UVV-Dashboard
 */
export async function fetchUvvControlStats(): Promise<UvvControlStats> {
  const drivers = await fetchDriversWithUvvStatus({ status: 'active' });

  const stats: UvvControlStats = {
    totalDrivers: drivers.length,
    overdueCount: drivers.filter((d) => d.uvv_status === 'overdue').length,
    dueSoonCount: drivers.filter((d) => d.uvv_status === 'due_soon').length,
    okCount: drivers.filter((d) => d.uvv_status === 'ok').length,
  };

  return stats;
}

/**
 * Lädt die Anzahl der Fahrer mit fälligen/überfälligen UVV-Unterweisungen
 * Wird für das Sidebar-Badge verwendet
 */
export async function fetchUvvWarningCount(): Promise<number> {
  const drivers = await fetchDriversWithUvvStatus({ status: 'active' });
  return drivers.filter(
    (d) => d.uvv_status === 'overdue' || d.uvv_status === 'due_soon'
  ).length;
}
