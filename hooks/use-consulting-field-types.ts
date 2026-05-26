'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingFieldType } from '@/types';

export function useConsultingFieldTypes(): ReturnType<
  typeof useQuery<ConsultingFieldType[]>
> {
  return useQuery<ConsultingFieldType[]>({
    queryKey: ['consulting-field-types'],
    queryFn: async () => {
      const res = await fetch('/api/consulting/field-types');
      if (!res.ok) throw new Error('Felder konnten nicht geladen werden');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateConsultingFieldType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<ConsultingFieldType, 'label' | 'is_enabled' | 'sort_order'>>;
    }) => {
      const res = await fetch(`/api/consulting/field-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Aktualisierung fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-field-types'] });
    },
  });
}

export function useCreateConsultingFieldType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { key: string; label: string }) => {
      const res = await fetch('/api/consulting/field-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Anlegen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-field-types'] });
    },
  });
}

export function useDeleteConsultingFieldType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/field-types/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-field-types'] });
    },
  });
}
