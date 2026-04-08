import { supabase } from '@/lib/supabase/client';
import type { Cost, CostInsert, CostUpdate, CostFilters, CostType } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt einen einzelnen Kosteneintrag
 */
export async function fetchCost(id: string): Promise<Cost> {
  const { data, error } = await supabase
    .from('costs')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      cost_type:cost_types(id, name, icon)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Fehler beim Laden des Kosteneintrags:', error);
    throw new Error(ERROR_MESSAGES.COST_NOT_FOUND);
  }

  return data;
}

/**
 * Lädt alle Kostentypen aus der Datenbank
 */
export async function fetchCostTypes(): Promise<CostType[]> {
  const { data, error } = await supabase
    .from('cost_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Kostentypen:', error);
    throw new Error('Kostentypen konnten nicht geladen werden');
  }

  return (data ?? []) as CostType[];
}

/**
 * Lädt alle Kosten mit optionalen Filtern
 */
export async function fetchCosts(filters?: CostFilters): Promise<Cost[]> {
  let query = supabase
    .from('costs')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      cost_type:cost_types(id, name, icon)
    `)
    .order('date', { ascending: false });

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

  return data ?? [];
}

/**
 * Berechnet die Kosten für den aktuellen Monat
 */
export async function fetchCostsThisMonth(): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('costs')
    .select('amount')
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

  if (error) {
    console.error('Fehler beim Laden der Monatskosten:', error);
    return 0;
  }

  return (data ?? []).reduce((sum, cost) => sum + (cost.amount || 0), 0);
}

/**
 * Erstellt einen neuen Kosteneintrag
 */
export async function createCost(cost: CostInsert): Promise<Cost> {
  const { data, error } = await supabase
    .from('costs')
    .insert(cost)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen der Kosten:', error);
    throw new Error(ERROR_MESSAGES.COST_CREATE_FAILED);
  }

  // Wenn Kilometerstand angegeben, in Historie speichern
  if (cost.mileage_at_cost) {
    await supabase.from('mileage_logs').insert({
      vehicle_id: cost.vehicle_id,
      mileage: cost.mileage_at_cost,
      source: 'cost_entry',
    });

    // Fahrzeug-Kilometerstand aktualisieren
    await supabase
      .from('vehicles')
      .update({ mileage: cost.mileage_at_cost })
      .eq('id', cost.vehicle_id);
  }

  return data;
}

/**
 * Aktualisiert einen Kosteneintrag
 */
export async function updateCost(id: string, cost: CostUpdate): Promise<Cost> {
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

  // Wenn Kilometerstand angegeben, in Historie speichern
  if (cost.mileage_at_cost && cost.vehicle_id) {
    await supabase.from('mileage_logs').insert({
      vehicle_id: cost.vehicle_id,
      mileage: cost.mileage_at_cost,
      source: 'cost_entry',
    });

    // Fahrzeug-Kilometerstand aktualisieren
    await supabase
      .from('vehicles')
      .update({ mileage: cost.mileage_at_cost })
      .eq('id', cost.vehicle_id);
  }

  return data;
}

/**
 * Löscht einen Kosteneintrag
 */
export async function deleteCost(id: string): Promise<void> {
  const { error } = await supabase
    .from('costs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen der Kosten:', error);
    throw new Error(ERROR_MESSAGES.COST_DELETE_FAILED);
  }
}
