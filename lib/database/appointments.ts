import { createAdminClient } from '@/lib/supabase/admin';
import type { Appointment, AppointmentInsert, AppointmentUpdate, AppointmentFilters, UpcomingAppointments } from '@/types';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import { assertVehicleBelongsToTenant } from '@/lib/database/tenant-guards';

// appointments hat kein direktes company_id → Tenant-Scope läuft über vehicle.company_id.
const APPOINTMENT_COLUMNS = `
  id, vehicle_id, appointment_type_id, due_date, completed_date, status, notes, created_at, updated_at,
  vehicle:vehicles!inner(id, license_plate, brand, model, company_id),
  appointment_type:appointment_types(id, name, color)
`;

export interface AppointmentQueryFilters extends AppointmentFilters {
  tenantCompanyId?: string | null;
}

export async function fetchAppointment(id: string, tenantCompanyId?: string | null): Promise<Appointment> {
  const supabase = createAdminClient();
  let query = supabase.from('appointments').select(APPOINTMENT_COLUMNS).eq('id', id);

  if (tenantCompanyId) {
    query = query.eq('vehicle.company_id', tenantCompanyId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Fehler beim Laden des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_NOT_FOUND);
  }

  return data as unknown as Appointment;
}

export async function fetchAppointments(filters?: AppointmentQueryFilters): Promise<Appointment[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .order('due_date');

  if (filters?.tenantCompanyId) {
    query = query.eq('vehicle.company_id', filters.tenantCompanyId);
  }

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

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Termine:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_LOAD_FAILED);
  }

  return (data ?? []) as unknown as Appointment[];
}

/**
 * Lädt überfällige und bald fällige Termine (für Dashboard).
 *
 * Status-Buckets:
 * - overdue: due_date < heute
 * - urgent:  in den nächsten 14 Tagen fällig
 * - upcoming: in 15-30 Tagen fällig
 */
export async function fetchUpcomingAppointments(tenantCompanyId?: string | null): Promise<UpcomingAppointments> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);

  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const supabase = createAdminClient();
  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .neq('status', 'completed')
    .lte('due_date', in30Days.toISOString())
    .order('due_date');

  if (tenantCompanyId) {
    query = query.eq('vehicle.company_id', tenantCompanyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Termine:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_LOAD_FAILED);
  }

  const appointments = (data ?? []) as unknown as Appointment[];

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

export async function createAppointment(appointment: AppointmentInsert, tenantCompanyId?: string | null): Promise<Appointment> {
  const supabase = createAdminClient();
  if (tenantCompanyId && appointment.vehicle_id) {
    await assertVehicleBelongsToTenant(appointment.vehicle_id, tenantCompanyId);
  }

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

export async function updateAppointment(id: string, updates: AppointmentUpdate, tenantCompanyId?: string | null): Promise<Appointment> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await fetchAppointment(id, tenantCompanyId);
  }

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

export async function completeAppointment(id: string, tenantCompanyId?: string | null): Promise<void> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await fetchAppointment(id, tenantCompanyId);
  }

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

export async function deleteAppointment(id: string, tenantCompanyId?: string | null): Promise<void> {
  const supabase = createAdminClient();
  if (tenantCompanyId) {
    await fetchAppointment(id, tenantCompanyId);
  }

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    throw new Error(ERROR_MESSAGES.APPOINTMENT_DELETE_FAILED);
  }
}
