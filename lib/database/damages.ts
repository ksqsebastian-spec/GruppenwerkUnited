import { supabase } from '@/lib/supabase/client';
import type { Damage, DamageInsert, DamageUpdate, DamageFilters, DamageStatus } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

// Tenant-Scope: damages haben kein direktes company_id. Filterung läuft über
// `vehicle:vehicles!inner(company_id)` mit foreignTable-Filter.
const DAMAGE_COLUMNS = `
  id, vehicle_id, damage_type_id, date, description, location, cost_estimate, actual_cost,
  insurance_claim, insurance_claim_number, status, reported_by, notes, created_at, updated_at,
  vehicle:vehicles!inner(id, license_plate, brand, model, company_id),
  damage_type:damage_types(id, name),
  damage_images(id, file_path, uploaded_at)
`;

export interface DamageQueryFilters extends DamageFilters {
  /** Server-erzwungener Tenant-Filter (aus Session). */
  tenantCompanyId?: string | null;
}

/**
 * Lädt alle Schäden. tenantCompanyId MUSS aus Session kommen, nicht aus Request.
 */
export async function fetchDamages(filters?: DamageQueryFilters): Promise<Damage[]> {
  let query = supabase
    .from('damages')
    .select(DAMAGE_COLUMNS)
    .order('date', { ascending: false });

  if (filters?.tenantCompanyId) {
    // Foreign-Table-Filter: nur Schäden zu Fahrzeugen der eigenen Firma
    query = query.eq('vehicle.company_id', filters.tenantCompanyId);
  }

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Schäden:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_LOAD_FAILED);
  }

  return (data ?? []) as unknown as Damage[];
}

export async function fetchDamage(id: string, tenantCompanyId?: string | null): Promise<Damage | null> {
  let query = supabase
    .from('damages')
    .select(DAMAGE_COLUMNS)
    .eq('id', id);

  if (tenantCompanyId) {
    query = query.eq('vehicle.company_id', tenantCompanyId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Schadens:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_NOT_FOUND);
  }

  return data as unknown as Damage;
}

/**
 * Zählt offene Schäden. Optional auf Tenant gefiltert.
 */
export async function countOpenDamages(tenantCompanyId?: string | null): Promise<number> {
  let query = supabase
    .from('damages')
    .select('id, vehicle:vehicles!inner(company_id)', { count: 'exact', head: true })
    .neq('status', 'completed');

  if (tenantCompanyId) {
    query = query.eq('vehicle.company_id', tenantCompanyId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Fehler beim Zählen der Schäden:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Verifiziert, dass ein Fahrzeug zur Tenant-Firma gehört, bevor Damage erstellt wird.
 */
async function assertVehicleBelongsToTenant(vehicleId: string, tenantCompanyId: string): Promise<void> {
  const { data } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('company_id', tenantCompanyId)
    .maybeSingle();
  if (!data) {
    throw new Error('Fahrzeug nicht gefunden');
  }
}

export async function createDamage(damage: DamageInsert, tenantCompanyId?: string | null): Promise<Damage> {
  if (tenantCompanyId && damage.vehicle_id) {
    await assertVehicleBelongsToTenant(damage.vehicle_id, tenantCompanyId);
  }

  const { data, error } = await supabase
    .from('damages')
    .insert(damage)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Schadens:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_CREATE_FAILED);
  }

  return data;
}

export async function updateDamage(id: string, updates: DamageUpdate, tenantCompanyId?: string | null): Promise<Damage> {
  // Bei Tenant-Scope erst Ownership prüfen
  if (tenantCompanyId) {
    const existing = await fetchDamage(id, tenantCompanyId);
    if (!existing) throw new Error(ERROR_MESSAGES.DAMAGE_NOT_FOUND);
  }

  const { data, error } = await supabase
    .from('damages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Schadens:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_UPDATE_FAILED);
  }

  return data;
}

export async function updateDamageStatus(id: string, status: DamageStatus, tenantCompanyId?: string | null): Promise<void> {
  if (tenantCompanyId) {
    const existing = await fetchDamage(id, tenantCompanyId);
    if (!existing) throw new Error(ERROR_MESSAGES.DAMAGE_NOT_FOUND);
  }

  const { error } = await supabase
    .from('damages')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Aktualisieren des Schadensstatus:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_STATUS_UPDATE_FAILED);
  }
}

export async function deleteDamage(id: string, tenantCompanyId?: string | null): Promise<void> {
  if (tenantCompanyId) {
    const existing = await fetchDamage(id, tenantCompanyId);
    if (!existing) throw new Error(ERROR_MESSAGES.DAMAGE_NOT_FOUND);
  }

  const { error } = await supabase
    .from('damages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Schadens:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_DELETE_FAILED);
  }
}
