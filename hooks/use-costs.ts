import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { Cost, CostInsert, CostUpdate, CostFilters, CostType } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

export function useCost(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cost', id],
    queryFn: () => apiFetch<Cost>(`/api/fuhrpark/costs/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.costs,
  });
}

export function useCostTypes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cost-types'],
    queryFn: () => apiFetch<CostType[]>('/api/fuhrpark/cost-types'),
    staleTime: 30 * 60 * 1000,
    enabled: !!user,
  });
}

export function useCosts(filters?: CostFilters) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
  if (filters?.costTypeId) params.set('costTypeId', filters.costTypeId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
  if (filters?.dateTo) params.set('dateTo', filters.dateTo.toISOString());

  return useQuery({
    queryKey: ['costs', filters],
    queryFn: () => apiFetch<Cost[]>(`/api/fuhrpark/costs?${params}`),
    staleTime: QUERY_STALE_TIMES.costs,
    enabled: !!user,
  });
}

export function useCostsThisMonth() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['costs', 'thisMonth'],
    queryFn: () => apiFetch<{ total: number }>('/api/fuhrpark/costs/this-month').then((d) => d.total),
    staleTime: QUERY_STALE_TIMES.costs,
    enabled: !!user,
  });
}

export function useCreateCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CostInsert) =>
      apiFetch<Cost>('/api/fuhrpark/costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Kosten erfolgreich erfasst');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CostUpdate }) =>
      apiFetch<Cost>(`/api/fuhrpark/costs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['cost', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Kosteneintrag erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/costs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Kosteneintrag erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
