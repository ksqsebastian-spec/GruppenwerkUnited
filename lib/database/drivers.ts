import { supabase } from '@/lib/supabase/client';
import type { Driver, DriverInsert, DriverUpdate } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt alle Fahrer
 */
export async function fetchDrivers(filters?: {
  companyId?: string;
  status?: 'active' | 'archived';
}): Promise<Driver[]> {
  let query = supabase
    .from('drivers')
    .select(`
      *,
      company:companies(id, name),
      vehicle_drivers(
        id,
        is_primary,
        vehicle:vehicles(id, license_plate)
      )
    `)
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

  return data ?? [];
}

/**
 * Lädt einen einzelnen Fahrer
 */
export async function fetchDriver(id: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      company:companies(id, name),
      vehicle_drivers(
        id,
        is_primary,
        vehicle:vehicles(id, license_plate, brand, model)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  return data;
}

/**
 * Erstellt einen neuen Fahrer
 */
export async function createDriver(driver: DriverInsert): Promise<Driver> {
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

/**
 * Aktualisiert einen Fahrer
 */
export async function updateDriver(id: string, updates: DriverUpdate): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_UPDATE_FAILED);
  }

  return data;
}

/**
 * Archiviert einen Fahrer
 */
export async function archiveDriver(id: string): Promise<void> {
  const { error } = await supabase
    .from('drivers')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.DRIVER_DELETE_FAILED);
  }
}
