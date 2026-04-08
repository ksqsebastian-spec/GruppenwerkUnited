import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '@/lib/database/companies';
import { useAuth } from '@/components/providers/auth-provider';
import type { CompanyInsert, CompanyUpdate } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Hook für alle Firmen
 */
export function useCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: QUERY_STALE_TIMES.companies,
    enabled: !!user,
  });
}

/**
 * Hook zum Erstellen einer Firma
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyInsert) => createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Firma erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren einer Firma
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyUpdate }) =>
      updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Firma erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen einer Firma
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Firma erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
