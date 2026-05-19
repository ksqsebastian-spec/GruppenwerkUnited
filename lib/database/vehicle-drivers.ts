import { supabase } from '@/lib/supabase/client';
import type { VehicleDriver, VehicleDriverInsert } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt alle Fahrer-Zuweisungen für ein Fahrzeug
 */
export async function fetchVehicleDrivers(vehicleId: string): Promise<VehicleDriver[]> {
  const { data, error } = await supabase
    .from('vehicle_drivers')
    .select(`
      *,
      driver:drivers(id, first_name, last_name, email, phone)
    `)
    .eq('vehicle_id', vehicleId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Fahrer-Zuweisungen:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Lädt alle Fahrzeug-Zuweisungen für einen Fahrer
 */
export async function fetchDriverVehicles(driverId: string): Promise<VehicleDriver[]> {
  const { data, error } = await supabase
    .from('vehicle_drivers')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model)
    `)
    .eq('driver_id', driverId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Fahrzeug-Zuweisungen:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Weist einen Fahrer einem Fahrzeug zu
 */
export async function assignDriverToVehicle(
  data: VehicleDriverInsert
): Promise<VehicleDriver> {
  // Wenn als Hauptfahrer markiert, erst alle anderen auf nicht-primär setzen
  if (data.is_primary) {
    await supabase
      .from('vehicle_drivers')
      .update({ is_primary: false })
      .eq('vehicle_id', data.vehicle_id);
  }

  const { data: result, error } = await supabase
    .from('vehicle_drivers')
    .insert(data)
    .select(`
      *,
      driver:drivers(id, first_name, last_name, email, phone),
      vehicle:vehicles(id, license_plate, brand, model)
    `)
    .single();

  if (error) {
    // Unique constraint - Fahrer bereits zugewiesen
    if (error.code === '23505') {
      throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_ALREADY_ASSIGNED);
    }
    console.error('Fehler beim Zuweisen des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_ASSIGN_FAILED);
  }

  return result;
}

/**
 * Entfernt eine Fahrer-Fahrzeug-Zuweisung
 */
export async function unassignDriverFromVehicle(
  vehicleId: string,
  driverId: string
): Promise<void> {
  const { error } = await supabase
    .from('vehicle_drivers')
    .delete()
    .eq('vehicle_id', vehicleId)
    .eq('driver_id', driverId);

  if (error) {
    console.error('Fehler beim Entfernen der Zuweisung:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_UNASSIGN_FAILED);
  }
}

/**
 * Setzt einen Fahrer als Hauptfahrer für ein Fahrzeug
 */
export async function setPrimaryDriver(
  vehicleId: string,
  driverId: string
): Promise<void> {
  // Erst alle auf nicht-primär setzen
  const { error: resetError } = await supabase
    .from('vehicle_drivers')
    .update({ is_primary: false })
    .eq('vehicle_id', vehicleId);

  if (resetError) {
    console.error('Fehler beim Zurücksetzen der Hauptfahrer:', resetError);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_UPDATE_FAILED);
  }

  // Dann den ausgewählten Fahrer als Hauptfahrer setzen
  const { error } = await supabase
    .from('vehicle_drivers')
    .update({ is_primary: true })
    .eq('vehicle_id', vehicleId)
    .eq('driver_id', driverId);

  if (error) {
    console.error('Fehler beim Setzen des Hauptfahrers:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_UPDATE_FAILED);
  }
}
