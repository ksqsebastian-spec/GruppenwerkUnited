import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchVehicleDrivers,
  fetchDriverVehicles,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  setPrimaryDriver,
} from '@/lib/database/vehicle-drivers';
import { useAuth } from '@/components/providers/auth-provider';
import type { VehicleDriverInsert } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Hook für alle Fahrer-Zuweisungen eines Fahrzeugs
 */
export function useVehicleDrivers(vehicleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vehicle-drivers', vehicleId],
    queryFn: () => fetchVehicleDrivers(vehicleId!),
    staleTime: QUERY_STALE_TIMES.vehicles,
    enabled: !!vehicleId && !!user,
  });
}

/**
 * Hook für alle Fahrzeug-Zuweisungen eines Fahrers
 */
export function useDriverVehicles(driverId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-vehicles', driverId],
    queryFn: () => fetchDriverVehicles(driverId!),
    staleTime: QUERY_STALE_TIMES.drivers,
    enabled: !!driverId && !!user,
  });
}

/**
 * Hook zum Zuweisen eines Fahrers zu einem Fahrzeug
 */
export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VehicleDriverInsert) => assignDriverToVehicle(data),
    onSuccess: (_, variables) => {
      // Alle relevanten Queries invalidieren
      queryClient.invalidateQueries({ queryKey: ['vehicle-drivers', variables.vehicle_id] });
      queryClient.invalidateQueries({ queryKey: ['driver-vehicles', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicle_id] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Fahrer erfolgreich zugewiesen');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Entfernen einer Fahrer-Fahrzeug-Zuweisung
 */
export function useUnassignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      unassignDriverFromVehicle(vehicleId, driverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-drivers', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['driver-vehicles', variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Zuweisung erfolgreich entfernt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Setzen eines Hauptfahrers
 */
export function useSetPrimaryDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      setPrimaryDriver(vehicleId, driverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-drivers', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Hauptfahrer erfolgreich gesetzt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
