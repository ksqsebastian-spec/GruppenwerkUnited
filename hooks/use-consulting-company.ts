'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingCategoryWithCheckpoints } from '@/types';

export function useConsultingCompany(
  slug: string
): ReturnType<typeof useQuery<ConsultingCategoryWithCheckpoints[]>> {
  return useQuery<ConsultingCategoryWithCheckpoints[]>({
    queryKey: ['consulting-company', slug],
    queryFn: async () => {
      const res = await fetch(`/api/consulting/companies?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error('Daten konnten nicht geladen werden');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(slug),
  });
}

export function useCreateConsultingCheckpoint(
  companySlug: string
): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { category_id: string; label: string; apply_to_all: boolean }) => {
      const res = await fetch('/api/consulting/checkpoints', {
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
      queryClient.invalidateQueries({ queryKey: ['consulting-company', companySlug] });
      queryClient.invalidateQueries({ queryKey: ['consulting-companies'] });
    },
  });
}

export function useDeleteConsultingCheckpoint(
  companySlug: string
): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/checkpoints/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-company', companySlug] });
      queryClient.invalidateQueries({ queryKey: ['consulting-companies'] });
    },
  });
}
