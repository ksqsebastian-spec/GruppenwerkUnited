import { createAdminClient } from '@/lib/supabase/admin';
import type { Vehicle, VehicleInsert, VehicleUpdate, VehicleFilters } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/** Spalten der `vehicles`-Tabelle, die in Listen/Detail benötigt werden. */
const VEHICLE_LIST_COLUMNS = `
  id, license_plate, brand, model, year, vin, fuel_type, purchase_date, purchase_price,
  mileage, is_leased, leasing_company, leasing_end_date, leasing_rate, leasing_contract_number,
  holder, user_name, insurance_number, insurance_company, tuv_due_date, status, company_id,
  notes, created_at, updated_at,
  company:companies(id, name),
  appointments(id, due_date, status, appointment_type:appointment_types(name, color))
`;

const VEHICLE_DETAIL_COLUMNS = `
  id, license_plate, brand, model, year, vin, fuel_type, purchase_date, purchase_price,
  mileage, is_leased, leasing_company, leasing_end_date, leasing_rate, leasing_contract_number,
  holder, user_name, insurance_number, insurance_company, tuv_due_date, status, company_id,
  notes, created_at, updated_at,
  company:companies(id, name),
  appointments(*, appointment_type:appointment_types(*)),
  damages(*, damage_type:damage_types(*)),
  documents(*, document_type:document_types(*)),
  costs(*, cost_type:cost_types(*)),
  vehicle_drivers(id, is_primary, driver:drivers(*))
`;

/**
 * Lädt alle Fahrzeuge mit optionalen Filtern.
 *
 * Multi-Tenant-Hinweis: filters.companyId MUSS von server-seitiger Session kommen,
 * nicht von Client-Parametern. Siehe lib/auth/fuhrpark-scope.ts.
 */
export async function fetchVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('vehicles')
    .select(VEHICLE_LIST_COLUMNS)
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
    // Sicherheit: PostgREST-Metazeichen entfernen, um Filter-Injection zu verhindern
    const safe = filters.search.replace(/[%,()\\]/g, ' ').trim();
    query = query.or(
      `license_plate.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Fahrzeuge:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_LOAD_FAILED);
  }

  return (data ?? []) as unknown as Vehicle[];
}

/**
 * Lädt ein einzelnes Fahrzeug mit allen Relationen.
 * Bei gesetztem `tenantCompanyId` wird zusätzlich auf Eigentümerschaft geprüft.
 */
export async function fetchVehicle(id: string, tenantCompanyId?: string | null): Promise<Vehicle | null> {
  const supabase = createAdminClient();
  let query = supabase
    .from('vehicles')
    .select(VEHICLE_DETAIL_COLUMNS)
    .eq('id', id);

  if (tenantCompanyId) {
    query = query.eq('company_id', tenantCompanyId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Fehler beim Laden des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
  }

  return data as unknown as Vehicle;
}

/**
 * Erstellt ein neues Fahrzeug.
 */
export async function createVehicle(vehicle: VehicleInsert): Promise<Vehicle> {
  const supabase = createAdminClient();
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
 * Aktualisiert ein Fahrzeug. Bei gesetztem tenantCompanyId wird auf Eigentümerschaft geprüft.
 */
export async function updateVehicle(id: string, updates: VehicleUpdate, tenantCompanyId?: string | null): Promise<Vehicle> {
  const supabase = createAdminClient();
  let query = supabase
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (tenantCompanyId) {
    query = query.eq('company_id', tenantCompanyId);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_UPDATE_FAILED);
  }

  return data;
}

/**
 * Archiviert ein Fahrzeug (nicht löschen!).
 */
export async function archiveVehicle(id: string, tenantCompanyId?: string | null): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase
    .from('vehicles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (tenantCompanyId) query = query.eq('company_id', tenantCompanyId);

  const { error } = await query;

  if (error) {
    console.error('Fehler beim Archivieren des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_ARCHIVE_FAILED);
  }
}

/**
 * Löscht ein Fahrzeug dauerhaft.
 */
export async function deleteVehicle(id: string, tenantCompanyId?: string | null): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase.from('vehicles').delete().eq('id', id);
  if (tenantCompanyId) query = query.eq('company_id', tenantCompanyId);

  const { error } = await query;

  if (error) {
    console.error('Fehler beim Löschen des Fahrzeugs:', error);
    throw new Error(ERROR_MESSAGES.VEHICLE_DELETE_FAILED);
  }
}

// Seed-UUIDs aus supabase/schema/05_rls_grants_seed.sql — siehe DEFAULT_APPOINTMENT_TYPES.
const LEASING_RETURN_APPOINTMENT_TYPE_ID = '11111111-1111-1111-1111-111111111008';
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
  const supabase = createAdminClient();
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
    await supabase
      .from('appointments')
      .update({
        due_date: leasingEndDate,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAppointment.id);
  } else {
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
  const supabase = createAdminClient();
  if (!isLeased || !leasingRate || leasingRate <= 0) {
    return;
  }

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split('T')[0];

  // Existenz-Check: nur id selektieren, kein vollständiger Row-Fetch
  const { data: existingCost } = await supabase
    .from('costs')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('cost_type_id', LEASING_COST_TYPE_ID)
    .gte('date', firstOfMonth)
    .lt('date', firstOfNextMonth)
    .maybeSingle();

  if (existingCost) return;

  await supabase.from('costs').insert({
    vehicle_id: vehicleId,
    cost_type_id: LEASING_COST_TYPE_ID,
    amount: leasingRate,
    date: firstOfMonth,
    description: 'Monatliche Leasingrate',
  });
}
