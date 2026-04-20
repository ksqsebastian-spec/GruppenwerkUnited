import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  fetchDatenkodierungen,
  createDatenkodierung,
  deleteDatenkodierung,
} from '@/lib/database/datenkodierung';
import { useAuth } from '@/components/providers/auth-provider';
import type { DatenkodierungInsert } from '@/types';

const QUERY_KEY = 'datenkodierungen';

export function useDatenkodierungen(search?: string) {
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, companyId, search],
    queryFn: () => fetchDatenkodierungen(companyId, search),
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
