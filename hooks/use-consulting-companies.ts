'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingCompanyWithCounts, ConsultingCompanyInsert } from '@/types';

export function useConsultingCompanies(): ReturnType<
  typeof useQuery<ConsultingCompanyWithCounts[]>
> {
  return useQuery<ConsultingCompanyWithCounts[]>({
    queryKey: ['consulting-companies'],
    queryFn: async () => {
      const res = await fetch('/api/consulting/companies');
      if (!res.ok) throw new Error('Unternehmen konnten nicht geladen werden');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateConsultingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConsultingCompanyInsert) => {
      const res = await fetch('/api/consulting/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Anlegen fehlgeschlagen');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-companies'] });
    },
  });
}

export function useDeleteConsultingCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-companies'] });
    },
  });
}
