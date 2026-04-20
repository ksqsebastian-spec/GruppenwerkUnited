import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchVehicles,
  fetchVehicle,
  createVehicle,
  updateVehicle,
  archiveVehicle,
  deleteVehicle,
} from '@/lib/database/vehicles';
import { useAuth } from '@/components/providers/auth-provider';
import { useFuhrparkCompanyId } from '@/hooks/use-fuhrpark-company';
import type { VehicleInsert, VehicleUpdate, VehicleFilters } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Hook für alle Fahrzeuge mit optionalen Filtern.
 * Filtert automatisch nach Firma des eingeloggten Mandanten.
 */
export function useVehicles(filters?: VehicleFilters) {
  const { user, company } = useAuth();
  const { companyId, isLoading: companyLoading } = useFuhrparkCompanyId();

  const mergedFilters: VehicleFilters = {
    ...filters,
    ...(company && !company.isAdmin ? { companyId: companyId ?? undefined } : {}),
  };

  return useQuery({
    queryKey: ['vehicles', mergedFilters],
    queryFn: () => fetchVehicles(mergedFilters),
    staleTime: QUERY_STALE_TIMES.vehicles,
    // Warten bis Firmen-ID aufgelöst ist (außer bei Admins)
    enabled: !!user && (!company || company.isAdmin || (!!companyId && !companyLoading)),
  });
}

/**
 * Hook für ein einzelnes Fahrzeug
 */
export function useVehicle(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => fetchVehicle(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.vehicles,
  });
}

/**
 * Hook zum Erstellen eines Fahrzeugs
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VehicleInsert) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Fahrzeugs
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdate }) =>
      updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      toast.success('Fahrzeug erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Archivieren eines Fahrzeugs
 */
export function useArchiveVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich archiviert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen eines Fahrzeugs
 */
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
