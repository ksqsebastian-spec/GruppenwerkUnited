import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { Damage, DamageInsert, DamageUpdate, DamageFilters, DamageStatus, DamageType } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

export function useDamageTypes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['damage-types'],
    queryFn: () => apiFetch<DamageType[]>('/api/fuhrpark/damage-types'),
    staleTime: 30 * 60 * 1000,
    enabled: !!user,
  });
}

export function useDamages(filters?: DamageFilters) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
  if (filters?.status) params.set('status', filters.status);

  return useQuery({
    queryKey: ['damages', filters],
    queryFn: () => apiFetch<Damage[]>(`/api/fuhrpark/damages?${params}`),
    staleTime: QUERY_STALE_TIMES.damages,
    enabled: !!user,
  });
}

export function useDamage(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['damage', id],
    queryFn: () => apiFetch<Damage>(`/api/fuhrpark/damages/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.damages,
  });
}

export function useOpenDamagesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['damages', 'count'],
    queryFn: () => apiFetch<{ count: number }>('/api/fuhrpark/damages/count').then((d) => d.count),
    staleTime: QUERY_STALE_TIMES.damages,
    enabled: !!user,
  });
}

export function useCreateDamage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DamageInsert) =>
      apiFetch<Damage>('/api/fuhrpark/damages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      toast.success('Schaden erfolgreich gemeldet');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDamage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DamageUpdate }) =>
      apiFetch<Damage>(`/api/fuhrpark/damages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      queryClient.invalidateQueries({ queryKey: ['damage', variables.id] });
      toast.success('Schaden erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDamageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DamageStatus }) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/damages/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      toast.success('Status erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteDamage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/damages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      toast.success('Schaden erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
