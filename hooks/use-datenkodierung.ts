import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  fetchDatenkodierungen,
  createDatenkodierung,
  deleteDatenkodierung,
  updateDatenkodierungTags,
} from '@/lib/database/datenkodierung';
import { useAuth } from '@/components/providers/auth-provider';
import type { DatenkodierungInsert } from '@/types';

const QUERY_KEY = 'datenkodierungen';

export function useDatenkodierungen(search?: string, tag?: string) {
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, companyId, search, tag],
    queryFn: () => fetchDatenkodierungen(companyId, search, tag),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateDatenkodierung() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation({
    mutationFn: (data: DatenkodierungInsert) => createDatenkodierung(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateDatenkodierungTags() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      updateDatenkodierungTags(companyId, id, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteDatenkodierung() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation({
    mutationFn: (id: string) => deleteDatenkodierung(companyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Datensatz erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
