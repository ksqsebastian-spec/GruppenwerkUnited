import { supabase } from '@/lib/supabase/client';
import type { Cost, CostInsert, CostUpdate, CostFilters, CostType } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

// costs hat kein direktes company_id → Tenant-Scope läuft über vehicle.company_id.
const COST_COLUMNS = `
  id, vehicle_id, cost_type_id, date, amount, description, mileage_at_cost, receipt_path, notes, created_at,
  vehicle:vehicles!inner(id, license_plate, brand, model, company_id),
  cost_type:cost_types(id, name, icon)
`;

export interface CostQueryFilters extends CostFilters {
  /** Server-erzwungener Tenant-Filter (aus Session). */
  tenantCompanyId?: string | null;
}

export async function fetchCost(id: string, tenantCompanyId?: string | null): Promise<Cost> {
  let query = supabase.from('costs').select(COST_COLUMNS).eq('id', id);

  if (tenantCompanyId) {
    query = query.eq('vehicle.company_id', tenantCompanyId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Fehler beim Laden des Kosteneintrags:', error);
    throw new Error(ERROR_MESSAGES.COST_NOT_FOUND);
  }

  return data as unknown as Cost;
}

export async function fetchCostTypes(): Promise<CostType[]> {
  const { data, error } = await supabase
    .from('cost_types')
    .select('id, name, icon')
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Kostentypen:', error);
    throw new Error('Kostentypen konnten nicht geladen werden');
  }

  return (data ?? []) as CostType[];
}

export async function fetchCosts(filters?: CostQueryFilters): Promise<Cost[]> {
  let query = supabase
    .from('costs')
    .select(COST_COLUMNS)
    .order('date', { ascending: false });

  if (filters?.tenantCompanyId) {
    query = query.eq('vehicle.company_id', filters.tenantCompanyId);
  }

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  if (filters?.costTypeId) {
    query = query.eq('cost_type_id', filters.costTypeId);
  }

  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom.toISOString().split('T')[0]);
  }

  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo.toISOString().split('T')[0]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Kosten:', error);
    throw new Error(ERROR_MESSAGES.COST_LOAD_FAILED);
  }

  return (data ?? []) as unknown as Cost[];
}

/**
 * Berechnet die Summe der Kosten für den aktuellen Monat (optional pro Tenant).
 */
export async function fetchCostsThisMonth(tenantCompanyId?: string | null): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let query = supabase
    .from('costs')
    .select('amount, vehicle:vehicles!inner(company_id)')
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

  if (tenantCompanyId) {
    query = query.eq('vehicle.company_id', tenantCompanyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Monatskosten:', error);
    return 0;
  }

  return (data ?? []).reduce((sum, cost: { amount: number | null }) => sum + (cost.amount || 0), 0);
}

async function assertVehicleBelongsToTenant(vehicleId: string, tenantCompanyId: string): Promise<void> {
  const { data } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('company_id', tenantCompanyId)
    .maybeSingle();
  if (!data) throw new Error('Fahrzeug nicht gefunden');
}

export async function createCost(cost: CostInsert, tenantCompanyId?: string | null): Promise<Cost> {
  if (tenantCompanyId && cost.vehicle_id) {
    await assertVehicleBelongsToTenant(cost.vehicle_id, tenantCompanyId);
  }

  const { data, error } = await supabase
    .from('costs')
    .insert(cost)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen der Kosten:', error);
    throw new Error(ERROR_MESSAGES.COST_CREATE_FAILED);
  }

  // Wenn Kilometerstand angegeben, Historie schreiben + Fahrzeug aktualisieren
  if (cost.mileage_at_cost) {
    await Promise.all([
      supabase.from('mileage_logs').insert({
        vehicle_id: cost.vehicle_id,
        mileage: cost.mileage_at_cost,
        source: 'cost_entry',
      }),
      supabase
        .from('vehicles')
        .update({ mileage: cost.mileage_at_cost })
        .eq('id', cost.vehicle_id),
    ]);
  }

  return data;
}

export async function updateCost(id: string, cost: CostUpdate, tenantCompanyId?: string | null): Promise<Cost> {
  if (tenantCompanyId) {
    await fetchCost(id, tenantCompanyId); // wirft, wenn nicht im Scope
  }

  const { data, error } = await supabase
    .from('costs')
    .update(cost)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren der Kosten:', error);
    throw new Error(ERROR_MESSAGES.COST_UPDATE_FAILED);
  }

  if (cost.mileage_at_cost && cost.vehicle_id) {
    await Promise.all([
      supabase.from('mileage_logs').insert({
        vehicle_id: cost.vehicle_id,
        mileage: cost.mileage_at_cost,
        source: 'cost_entry',
      }),
      supabase
        .from('vehicles')
        .update({ mileage: cost.mileage_at_cost })
        .eq('id', cost.vehicle_id),
    ]);
  }

  return data;
}

export async function deleteCost(id: string, tenantCompanyId?: string | null): Promise<void> {
  if (tenantCompanyId) {
    await fetchCost(id, tenantCompanyId);
  }

  const { error } = await supabase
    .from('costs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen der Kosten:', error);
    throw new Error(ERROR_MESSAGES.COST_DELETE_FAILED);
  }
}
