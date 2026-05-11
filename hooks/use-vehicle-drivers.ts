import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { VehicleDriver, VehicleDriverInsert } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

export function useVehicleDrivers(vehicleId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vehicle-drivers', vehicleId],
    queryFn: () => apiFetch<VehicleDriver[]>(`/api/fuhrpark/vehicle-drivers?vehicleId=${vehicleId}`),
    staleTime: QUERY_STALE_TIMES.vehicles,
    enabled: !!vehicleId && !!user,
  });
}

export function useDriverVehicles(driverId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['driver-vehicles', driverId],
    queryFn: () => apiFetch<VehicleDriver[]>(`/api/fuhrpark/vehicle-drivers?driverId=${driverId}`),
    staleTime: QUERY_STALE_TIMES.drivers,
    enabled: !!driverId && !!user,
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleDriverInsert) =>
      apiFetch<VehicleDriver>('/api/fuhrpark/vehicle-drivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-drivers', variables.vehicle_id] });
      queryClient.invalidateQueries({ queryKey: ['driver-vehicles', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicle_id] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Fahrer erfolgreich zugewiesen');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUnassignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      apiFetch<{ success: boolean }>('/api/fuhrpark/vehicle-drivers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicleId, driverId }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-drivers', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['driver-vehicles', variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Zuweisung erfolgreich entfernt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSetPrimaryDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      apiFetch<{ success: boolean }>('/api/fuhrpark/vehicle-drivers/primary', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicleId, driverId }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-drivers', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Hauptfahrer erfolgreich gesetzt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
