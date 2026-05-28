import { createAdminClient } from '@/lib/supabase/admin';
import type { Driver, DriverInsert, DriverUpdate } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

const DRIVER_LIST_COLUMNS = `
  id, first_name, last_name, email, phone, license_class, license_expiry,
  company_id, status, notes, is_license_inspector, is_uvv_instructor, created_at, updated_at,
  company:companies(id, name),
  vehicle_drivers(id, is_primary, vehicle:vehicles(id, license_plate))
`;

const DRIVER_DETAIL_COLUMNS = `
  id, first_name, last_name, email, phone, license_class, license_expiry,
  company_id, status, notes, is_license_inspector, is_uvv_instructor, created_at, updated_at,
  company:companies(id, name),
  vehicle_drivers(id, is_primary, vehicle:vehicles(id, license_plate, brand, model))
`;

/**
 * Lädt alle Fahrer. filters.companyId MUSS aus der Session kommen.
 */
export async function fetchDrivers(filters?: {
  companyId?: string;
  status?: 'active' | 'archived';
}): Promise<Driver[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('drivers')
    .select(DRIVER_LIST_COLUMNS)
    .order('last_name');

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Fahrer:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_LOAD_FAILED);
  }

  return (data ?? []) as unknown as Driver[];
}

export async function fetchDriver(id: string, tenantCompanyId?: string | null): Promise<Driver | null> {
  const supabase = createAdminClient();
  let query = supabase
    .from('drivers')
    .select(DRIVER_DETAIL_COLUMNS)
    .eq('id', id);

  if (tenantCompanyId) {
    query = query.eq('company_id', tenantCompanyId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  return data as unknown as Driver;
}

export async function createDriver(driver: DriverInsert): Promise<Driver> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('drivers')
    .insert(driver)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_CREATE_FAILED);
  }

  return data;
}

export async function updateDriver(id: string, updates: DriverUpdate, tenantCompanyId?: string | null): Promise<Driver> {
  const supabase = createAdminClient();
  let query = supabase
    .from('drivers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (tenantCompanyId) query = query.eq('company_id', tenantCompanyId);

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_UPDATE_FAILED);
  }

  return data;
}

export async function archiveDriver(id: string, tenantCompanyId?: string | null): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase
    .from('drivers')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (tenantCompanyId) query = query.eq('company_id', tenantCompanyId);

  const { error } = await query;

  if (error) {
    console.error('Fehler beim Archivieren des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_DELETE_FAILED);
  }
}

/**
 * Prüft ob ein Fahrer zur angegebenen Firma gehört. Wird für Tenant-Isolation
 * bei Sub-Resource-Routen (z. B. UVV-Unterweisungen) verwendet.
 */
export async function assertDriverInScope(driverId: string, tenantCompanyId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('drivers')
    .select('id')
    .eq('id', driverId)
    .eq('company_id', tenantCompanyId)
    .maybeSingle();

  if (error) {
    console.error('Fehler beim Prüfen des Fahrer-Scopes:', error);
    return false;
  }
  return !!data;
}

/**
 * Prüft ob ALLE Fahrer in der Liste zur angegebenen Firma gehören.
 */
export async function assertDriversInScope(driverIds: string[], tenantCompanyId: string): Promise<boolean> {
  if (driverIds.length === 0) return true;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('drivers')
    .select('id')
    .in('id', driverIds)
    .eq('company_id', tenantCompanyId);

  if (error) {
    console.error('Fehler beim Prüfen des Fahrer-Scopes:', error);
    return false;
  }
  return (data?.length ?? 0) === driverIds.length;
}
