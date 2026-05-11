import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { Driver, DriverInsert, DriverUpdate } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

export function useDrivers(filters?: { companyId?: string; status?: 'active' | 'archived' }) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.companyId) params.set('companyId', filters.companyId);
  if (filters?.status) params.set('status', filters.status);

  return useQuery({
    queryKey: ['drivers', filters],
    queryFn: () => apiFetch<Driver[]>(`/api/fuhrpark/drivers?${params}`),
    staleTime: QUERY_STALE_TIMES.drivers,
    enabled: !!user,
  });
}

export function useDriver(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => apiFetch<Driver>(`/api/fuhrpark/drivers/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.drivers,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DriverInsert) =>
      apiFetch<Driver>('/api/fuhrpark/drivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Fahrer erfolgreich angelegt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DriverUpdate }) =>
      apiFetch<Driver>(`/api/fuhrpark/drivers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.id] });
      toast.success('Fahrer erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useArchiveDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/drivers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Fahrer erfolgreich archiviert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
