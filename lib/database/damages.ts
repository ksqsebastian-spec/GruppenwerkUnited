import { supabase } from '@/lib/supabase/client';
import type { Damage, DamageInsert, DamageUpdate, DamageFilters, DamageStatus } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt alle Schäden mit optionalen Filtern
 */
export async function fetchDamages(filters?: DamageFilters): Promise<Damage[]> {
  let query = supabase
    .from('damages')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      damage_type:damage_types(id, name),
      damage_images(id, file_path, uploaded_at)
    `)
    .order('date', { ascending: false });

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

  return data ?? [];
}

/**
 * Lädt einen einzelnen Schaden
 */
export async function fetchDamage(id: string): Promise<Damage | null> {
  const { data, error } = await supabase
    .from('damages')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      damage_type:damage_types(id, name),
      damage_images(id, file_path, uploaded_at)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Schadens:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_NOT_FOUND);
  }

  return data;
}

/**
 * Zählt offene Schäden
 */
export async function countOpenDamages(): Promise<number> {
  const { count, error } = await supabase
    .from('damages')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed');

  if (error) {
    console.error('Fehler beim Zählen der Schäden:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Erstellt einen neuen Schaden
 */
export async function createDamage(damage: DamageInsert): Promise<Damage> {
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

/**
 * Aktualisiert einen Schaden
 */
export async function updateDamage(id: string, updates: DamageUpdate): Promise<Damage> {
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

/**
 * Aktualisiert den Status eines Schadens
 */
export async function updateDamageStatus(id: string, status: DamageStatus): Promise<void> {
  const { error } = await supabase
    .from('damages')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Aktualisieren des Schadensstatus:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_STATUS_UPDATE_FAILED);
  }
}

/**
 * Löscht einen Schaden
 */
export async function deleteDamage(id: string): Promise<void> {
  const { error } = await supabase
    .from('damages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Schadens:', error);
    throw new Error(ERROR_MESSAGES.DAMAGE_DELETE_FAILED);
  }
}
