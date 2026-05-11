import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { Datenkodierung, DatenkodierungInsert } from '@/types';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

const QUERY_KEY = 'datenkodierungen';

export function useDatenkodierungen(search?: string, tag?: string) {
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';
  const params = new URLSearchParams({ companyId });
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);

  return useQuery({
    queryKey: [QUERY_KEY, companyId, search, tag],
    queryFn: () => apiFetch<Datenkodierung[]>(`/api/fuhrpark/datenkodierung?${params}`),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateDatenkodierung() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation({
    mutationFn: (data: DatenkodierungInsert) =>
      apiFetch<Datenkodierung>('/api/fuhrpark/datenkodierung', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId, ...data }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDatenkodierungTags() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      apiFetch<Datenkodierung>('/api/fuhrpark/datenkodierung', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId, id, tags }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteDatenkodierung() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>('/api/fuhrpark/datenkodierung', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId, id }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Datensatz erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
