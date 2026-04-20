import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  fetchDatenkodierungen,
  createDatenkodierung,
  deleteDatenkodierung,
} from '@/lib/database/datenkodierung';
import type { DatenkodierungInsert } from '@/types';

const QUERY_KEY = 'datenkodierungen';

export function useDatenkodierungen(search?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, search],
    queryFn: () => fetchDatenkodierungen(search),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateDatenkodierung() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DatenkodierungInsert) => createDatenkodierung(data),
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

  return useMutation({
    mutationFn: (id: string) => deleteDatenkodierung(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Datensatz erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
