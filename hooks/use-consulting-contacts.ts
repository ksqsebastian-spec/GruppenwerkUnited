'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingContact } from '@/types';

export function useConsultingContacts(companyId: string | undefined) {
  return useQuery<ConsultingContact[]>({
    queryKey: ['consulting-contacts', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/consulting/contacts?company_id=${companyId}`);
      if (!res.ok) throw new Error('Ansprechpartner konnten nicht geladen werden');
      return res.json();
    },
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateConsultingContact(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ConsultingContact, 'id' | 'created_at' | 'updated_at'>) => {
      const res = await fetch('/api/consulting/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Anlegen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-contacts', companyId] });
    },
  });
}

export function useUpdateConsultingContact(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConsultingContact> }) => {
      const res = await fetch(`/api/consulting/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Aktualisierung fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-contacts', companyId] });
    },
  });
}

export function useDeleteConsultingContact(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-contacts', companyId] });
    },
  });
}
