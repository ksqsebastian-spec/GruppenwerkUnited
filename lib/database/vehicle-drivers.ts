import { createAdminClient } from '@/lib/supabase/admin';
import type { VehicleDriver, VehicleDriverInsert } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import { assertVehicleBelongsToTenant } from '@/lib/database/tenant-guards';

const VEHICLE_DRIVER_FROM_VEHICLE = `
  id, vehicle_id, driver_id, is_primary, assigned_at,
  driver:drivers(id, first_name, last_name, email, phone, company_id)
`;

const VEHICLE_DRIVER_FROM_DRIVER = `
  id, vehicle_id, driver_id, is_primary, assigned_at,
  vehicle:vehicles(id, license_plate, brand, model, company_id)
`;

const VEHICLE_DRIVER_BOTH = `
  id, vehicle_id, driver_id, is_primary, assigned_at,
  driver:drivers(id, first_name, last_name, email, phone, company_id),
  vehicle:vehicles(id, license_plate, brand, model, company_id)
`;

async function assertDriverBelongsToTenant(driverId: string, tenantCompanyId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('drivers')
    .select('id')
    .eq('id', driverId)
    .eq('company_id', tenantCompanyId)
    .maybeSingle();
  if (!data) throw new Error('Fahrer nicht gefunden');
}

export async function fetchVehicleDrivers(vehicleId: string, tenantCompanyId?: string | null): Promise<VehicleDriver[]> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await assertVehicleBelongsToTenant(vehicleId, tenantCompanyId);
  }

  const { data, error } = await supabase
    .from('vehicle_drivers')
    .select(VEHICLE_DRIVER_FROM_VEHICLE)
    .eq('vehicle_id', vehicleId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Fahrer-Zuweisungen:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_LOAD_FAILED);
  }

  return (data ?? []) as unknown as VehicleDriver[];
}

export async function fetchDriverVehicles(driverId: string, tenantCompanyId?: string | null): Promise<VehicleDriver[]> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await assertDriverBelongsToTenant(driverId, tenantCompanyId);
  }

  const { data, error } = await supabase
    .from('vehicle_drivers')
    .select(VEHICLE_DRIVER_FROM_DRIVER)
    .eq('driver_id', driverId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Fahrzeug-Zuweisungen:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_LOAD_FAILED);
  }

  return (data ?? []) as unknown as VehicleDriver[];
}

export async function assignDriverToVehicle(
  data: VehicleDriverInsert,
  tenantCompanyId?: string | null
): Promise<VehicleDriver> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await Promise.all([
      assertVehicleBelongsToTenant(data.vehicle_id, tenantCompanyId),
      assertDriverBelongsToTenant(data.driver_id, tenantCompanyId),
    ]);
  }

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
    .select(VEHICLE_DRIVER_BOTH)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_ALREADY_ASSIGNED);
    }
    console.error('Fehler beim Zuweisen des Fahrers:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_ASSIGN_FAILED);
  }

  return result as unknown as VehicleDriver;
}

export async function unassignDriverFromVehicle(
  vehicleId: string,
  driverId: string,
  tenantCompanyId?: string | null
): Promise<void> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await assertVehicleBelongsToTenant(vehicleId, tenantCompanyId);
  }

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

export async function setPrimaryDriver(
  vehicleId: string,
  driverId: string,
  tenantCompanyId?: string | null
): Promise<void> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await assertVehicleBelongsToTenant(vehicleId, tenantCompanyId);
  }

  // Zwei Updates: erst Reset aller Primary-Flags, dann gewählten Fahrer markieren.
  const { error: resetError } = await supabase
    .from('vehicle_drivers')
    .update({ is_primary: false })
    .eq('vehicle_id', vehicleId);

  if (resetError) {
    console.error('Fehler beim Zurücksetzen der Hauptfahrer:', resetError);
    throw new Error(ERROR_MESSAGES.VEHICLE_DRIVER_UPDATE_FAILED);
  }

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
