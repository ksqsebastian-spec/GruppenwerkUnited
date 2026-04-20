import { supabase } from '@/lib/supabase/client';
import type { Appointment, AppointmentInsert, AppointmentUpdate, AppointmentFilters, UpcomingAppointments } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';

/**
 * Lädt einen einzelnen Termin mit Details
 */
export async function fetchAppointment(id: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      appointment_type:appointment_types(id, name, color)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Fehler beim Laden des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_NOT_FOUND);
  }

  return data;
}

/**
 * Lädt alle Termine mit optionalen Filtern
 */
export async function fetchAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      appointment_type:appointment_types(id, name, color)
    `)
    .order('due_date');

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dueBefore) {
    query = query.lte('due_date', filters.dueBefore.toISOString());
  }

  if (filters?.dueAfter) {
    query = query.gte('due_date', filters.dueAfter.toISOString());
  }

  // Mandantenfilter: nur Termine der eigenen Fahrzeuge laden
  if (filters?.companyVehicleIds && filters.companyVehicleIds.length > 0) {
    query = query.in('vehicle_id', filters.companyVehicleIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Termine:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_LOAD_FAILED);
  }

  return data ?? [];
}

/**
 * Lädt überfällige und bald fällige Termine (für Dashboard),
 * optional gefiltert nach Fahrzeug-IDs
 */
export async function fetchUpcomingAppointments(vehicleIds?: string[]): Promise<UpcomingAppointments> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);

  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  let query = supabase
    .from('appointments')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      appointment_type:appointment_types(id, name, color)
    `)
    .neq('status', 'completed')
    .lte('due_date', in30Days.toISOString())
    .order('due_date');

  // Mandantenfilter: nur Termine der eigenen Fahrzeuge laden
  if (vehicleIds && vehicleIds.length > 0) {
    query = query.in('vehicle_id', vehicleIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Termine:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_LOAD_FAILED);
  }

  const appointments = data ?? [];

  return {
    overdue: appointments.filter((a) => new Date(a.due_date) < today),
    urgent: appointments.filter((a) => {
      const dueDate = new Date(a.due_date);
      return dueDate >= today && dueDate <= in14Days;
    }),
    upcoming: appointments.filter((a) => {
      const dueDate = new Date(a.due_date);
      return dueDate > in14Days && dueDate <= in30Days;
    }),
  };
}

/**
 * Erstellt einen neuen Termin
 */
export async function createAppointment(appointment: AppointmentInsert): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_CREATE_FAILED);
  }

  return data;
}

/**
 * Aktualisiert einen Termin
 */
export async function updateAppointment(id: string, updates: AppointmentUpdate): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_UPDATE_FAILED);
  }

  return data;
}

/**
 * Markiert einen Termin als erledigt
 */
export async function completeAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Abschließen des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_COMPLETE_FAILED);
  }
}

/**
 * Löscht einen Termin
 */
export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_DELETE_FAILED);
  }
}
