import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import {
  fetchDamages,
  fetchDamage,
  countOpenDamages,
  createDamage,
  updateDamage,
  updateDamageStatus,
  deleteDamage,
} from '@/lib/database/damages';
import { useAuth } from '@/components/providers/auth-provider';
import { useFuhrparkVehicleIds } from '@/hooks/use-fuhrpark-vehicle-ids';
import type { DamageInsert, DamageUpdate, DamageFilters, DamageStatus, DamageType } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Lädt alle Schadenstypen aus der Datenbank
 */
async function fetchDamageTypes(): Promise<DamageType[]> {
  const { data, error } = await supabase
    .from('damage_types')
    .select('*')
    .order('name');

  if (error) {
    console.error('Fehler beim Laden der Schadenstypen:', error);
    throw new Error('Schadenstypen konnten nicht geladen werden');
  }

  return (data ?? []) as DamageType[];
}

/**
 * Hook für alle Schadenstypen
 */
export function useDamageTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['damage-types'],
    queryFn: fetchDamageTypes,
    staleTime: 30 * 60 * 1000, // 30 Minuten
    enabled: !!user,
  });
}

/**
 * Hook für alle Schäden mit optionalen Filtern
 */
export function useDamages(filters?: DamageFilters) {
  const { user } = useAuth();
  const { vehicleIds, isLoading: vehicleIdsLoading } = useFuhrparkVehicleIds();

  // Mandantenfilter in den Filtern zusammenführen
  const mergedFilters: DamageFilters | undefined =
    vehicleIds !== null
      ? { ...filters, companyVehicleIds: vehicleIds }
      : filters;

  return useQuery({
    queryKey: ['damages', mergedFilters],
    queryFn: () => fetchDamages(mergedFilters),
    staleTime: QUERY_STALE_TIMES.damages,
    // Warten bis Fahrzeug-IDs aufgelöst sind
    enabled: !!user && !vehicleIdsLoading,
  });
}

/**
 * Hook für einen einzelnen Schaden
 */
export function useDamage(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['damage', id],
    queryFn: () => fetchDamage(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.damages,
  });
}

/**
 * Hook für die Anzahl offener Schäden (Dashboard)
 */
export function useOpenDamagesCount() {
  const { user } = useAuth();
  const { vehicleIds, isLoading: vehicleIdsLoading } = useFuhrparkVehicleIds();

  return useQuery({
    queryKey: ['damages', 'count', vehicleIds],
    queryFn: () => countOpenDamages(vehicleIds ?? undefined),
    staleTime: QUERY_STALE_TIMES.damages,
    // Warten bis Fahrzeug-IDs aufgelöst sind
    enabled: !!user && !vehicleIdsLoading,
  });
}

/**
 * Hook zum Erstellen eines Schadens
 */
export function useCreateDamage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DamageInsert) => createDamage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      toast.success('Schaden erfolgreich gemeldet');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Schadens
 */
export function useUpdateDamage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DamageUpdate }) =>
      updateDamage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      queryClient.invalidateQueries({ queryKey: ['damage', variables.id] });
      toast.success('Schaden erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren des Schadensstatus
 */
export function useUpdateDamageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DamageStatus }) =>
      updateDamageStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      toast.success('Status erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen eines Schadens
 */
export function useDeleteDamage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDamage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      toast.success('Schaden erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
