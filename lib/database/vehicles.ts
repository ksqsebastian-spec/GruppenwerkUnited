import { supabase } from '@/lib/supabase/client';
import type { Vehicle, VehicleInsert, VehicleUpdate, VehicleFilters } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt alle Fahrzeuge mit optionalen Filtern
 */
export async function fetchVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  let query = supabase
    .from('vehicles')
    .select(`
      *,
      company:companies(id, name),
      appointments(
        id,
        due_date,
        status,
        appointment_type:appointment_types(name, color)
      )
    `)
    .order('license_plate');

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.fuelType) {
    query = query.eq('fuel_type', filters.fuelType);
  }

  if (filters?.search) {
    query = query.or(
      `license_plate.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Fahrzeuge:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Lädt ein einzelnes Fahrzeug mit allen Relationen
 */
export async function fetchVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      company:companies(id, name),
      appointments(*,
        appointment_type:appointment_types(*)
      ),
      damages(*,
        damage_type:damage_types(*)
      ),
      documents(*,
        document_type:document_types(*)
      ),
      costs(*,
        cost_type:cost_types(*)
      ),
      vehicle_drivers(
        id,
        is_primary,
        driver:drivers(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
  }

  return data;
}

/**
 * Erstellt ein neues Fahrzeug
 */
export async function createVehicle(vehicle: VehicleInsert): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(ERROR_MESSAGES.VEHICLE_DUPLICATE_PLATE);
    }
    console.error('Fehler beim Erstellen des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_CREATE_FAILED);
  }

  return data;
}

/**
 * Aktualisiert ein Fahrzeug
 */
export async function updateVehicle(id: string, updates: VehicleUpdate): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_UPDATE_FAILED);
  }

  return data;
}

/**
 * Archiviert ein Fahrzeug (nicht löschen!)
 */
export async function archiveVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_ARCHIVE_FAILED);
  }
}

/**
 * Löscht ein Fahrzeug dauerhaft
 */
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DELETE_FAILED);
  }
}

// ID des Termin-Typs "Leasing-Rückgabe" aus den Seed-Daten
const LEASING_RETURN_APPOINTMENT_TYPE_ID = '11111111-1111-1111-1111-111111111008';

// ID des Kostentyps "Leasing" aus den Seed-Daten
const LEASING_COST_TYPE_ID = '33333333-3333-3333-3333-333333333006';

/**
 * Erstellt oder aktualisiert einen Leasing-Rückgabe-Termin für ein Fahrzeug.
 * Wird automatisch aufgerufen wenn ein Leasingfahrzeug mit Enddatum gespeichert wird.
 */
export async function syncLeasingAppointment(
  vehicleId: string,
  leasingEndDate: string | null,
  isLeased: boolean
): Promise<void> {
  // Prüfen ob bereits ein Leasing-Rückgabe-Termin existiert
  const { data: existingAppointment } = await supabase
    .from('appointments')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('appointment_type_id', LEASING_RETURN_APPOINTMENT_TYPE_ID)
    .maybeSingle();

  // Fall 1: Kein Leasing oder kein Enddatum -> Termin löschen falls vorhanden
  if (!isLeased || !leasingEndDate) {
    if (existingAppointment) {
      await supabase
        .from('appointments')
        .delete()
        .eq('id', existingAppointment.id);
    }
    return;
  }

  // Fall 2: Leasing mit Enddatum -> Termin erstellen oder aktualisieren
  if (existingAppointment) {
    // Termin aktualisieren
    await supabase
      .from('appointments')
      .update({
        due_date: leasingEndDate,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAppointment.id);
  } else {
    // Neuen Termin erstellen
    await supabase
      .from('appointments')
      .insert({
        vehicle_id: vehicleId,
        appointment_type_id: LEASING_RETURN_APPOINTMENT_TYPE_ID,
        due_date: leasingEndDate,
        status: 'pending',
        notes: 'Automatisch erstellt bei Leasingfahrzeug-Einrichtung',
      });
  }
}

/**
 * Erstellt automatisch einen Leasing-Kosteneintrag für den aktuellen Monat.
 * Wird nur erstellt wenn noch kein Eintrag für diesen Monat existiert.
 */
export async function syncLeasingCost(
  vehicleId: string,
  leasingRate: number | null | undefined,
  isLeased: boolean
): Promise<void> {
  // Kein Leasing oder keine Rate → nichts tun
  if (!isLeased || !leasingRate || leasingRate <= 0) {
    return;
  }

  // Erster Tag des aktuellen Monats
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split('T')[0];

  // Prüfen ob bereits ein Leasing-Kosteneintrag für diesen Monat existiert
  const { data: existingCost } = await supabase
    .from('costs')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('cost_type_id', LEASING_COST_TYPE_ID)
    .gte('date', firstOfMonth)
    .lt('date', firstOfNextMonth)
    .maybeSingle();

  // Bereits vorhanden → nichts tun
  if (existingCost) {
    return;
  }

  // Neuen Kosteneintrag erstellen
  await supabase.from('costs').insert({
    vehicle_id: vehicleId,
    cost_type_id: LEASING_COST_TYPE_ID,
    amount: leasingRate,
    date: firstOfMonth,
    description: 'Monatliche Leasingrate',
  });
}
