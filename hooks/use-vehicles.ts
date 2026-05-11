import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { Vehicle, VehicleInsert, VehicleUpdate, VehicleFilters } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

export function useVehicles(filters?: VehicleFilters) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.companyId) params.set('companyId', filters.companyId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.fuelType) params.set('fuelType', filters.fuelType);
  if (filters?.search) params.set('search', filters.search);

  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => apiFetch<Vehicle[]>(`/api/fuhrpark/vehicles?${params}`),
    staleTime: QUERY_STALE_TIMES.vehicles,
    enabled: !!user,
  });
}

export function useVehicle(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => apiFetch<Vehicle>(`/api/fuhrpark/vehicles/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.vehicles,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleInsert) =>
      apiFetch<Vehicle>('/api/fuhrpark/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich angelegt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdate }) =>
      apiFetch<Vehicle>(`/api/fuhrpark/vehicles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      toast.success('Fahrzeug erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useArchiveVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/vehicles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich archiviert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
