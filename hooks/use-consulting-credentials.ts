'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingCredential } from '@/types';

export function useConsultingCredentials(companyId: string | undefined) {
  return useQuery<ConsultingCredential[]>({
    queryKey: ['consulting-credentials', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/consulting/credentials?company_id=${companyId}`);
      if (!res.ok) throw new Error('Zugangsdaten konnten nicht geladen werden');
      return res.json();
    },
    enabled: Boolean(companyId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateConsultingCredential(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ConsultingCredential, 'id' | 'created_at' | 'updated_at'>) => {
      const res = await fetch('/api/consulting/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Anlegen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-credentials', companyId] });
    },
  });
}

export function useUpdateConsultingCredential(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConsultingCredential> }) => {
      const res = await fetch(`/api/consulting/credentials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Aktualisierung fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-credentials', companyId] });
    },
  });
}

export function useDeleteConsultingCredential(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/credentials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-credentials', companyId] });
    },
  });
}
