import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import {
  fetchAppointment,
  fetchAppointments,
  fetchUpcomingAppointments,
  createAppointment,
  updateAppointment,
  completeAppointment,
  deleteAppointment,
} from '@/lib/database/appointments';
import { useAuth } from '@/components/providers/auth-provider';
import { useFuhrparkVehicleIds } from '@/hooks/use-fuhrpark-vehicle-ids';
import type { AppointmentInsert, AppointmentUpdate, AppointmentFilters, AppointmentType } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Lädt alle Termintypen aus der Datenbank
 */
async function fetchAppointmentTypes(): Promise<AppointmentType[]> {
  const { data, error } = await supabase
    .from('appointment_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Termintypen:', error);
    throw new Error('Termintypen konnten nicht geladen werden');
  }

  return (data ?? []) as AppointmentType[];
}

/**
 * Hook für alle Termintypen
 */
export function useAppointmentTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointment-types'],
    queryFn: fetchAppointmentTypes,
    staleTime: 30 * 60 * 1000, // 30 Minuten
    enabled: !!user,
  });
}

/**
 * Hook für einen einzelnen Termin
 */
export function useAppointment(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => fetchAppointment(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.appointments,
  });
}

/**
 * Hook für alle Termine mit optionalen Filtern
 */
export function useAppointments(filters?: AppointmentFilters) {
  const { user } = useAuth();
  const { vehicleIds, isLoading: vehicleIdsLoading } = useFuhrparkVehicleIds();

  // Mandantenfilter in den Filtern zusammenführen
  const mergedFilters: AppointmentFilters | undefined =
    vehicleIds !== null
      ? { ...filters, companyVehicleIds: vehicleIds }
      : filters;

  return useQuery({
    queryKey: ['appointments', mergedFilters],
    queryFn: () => fetchAppointments(mergedFilters),
    staleTime: QUERY_STALE_TIMES.appointments,
    // Warten bis Fahrzeug-IDs aufgelöst sind
    enabled: !!user && !vehicleIdsLoading,
  });
}

/**
 * Hook für überfällige und bald fällige Termine (Dashboard)
 */
export function useUpcomingAppointments() {
  const { user } = useAuth();
  const { vehicleIds, isLoading: vehicleIdsLoading } = useFuhrparkVehicleIds();

  return useQuery({
    queryKey: ['appointments', 'upcoming', vehicleIds],
    queryFn: () => fetchUpcomingAppointments(vehicleIds ?? undefined),
    staleTime: QUERY_STALE_TIMES.appointments,
    // Warten bis Fahrzeug-IDs aufgelöst sind
    enabled: !!user && !vehicleIdsLoading,
  });
}

/**
 * Hook zum Erstellen eines Termins
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentInsert) => createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Termins
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Abschließen eines Termins
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin als erledigt markiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen eines Termins
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
