'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Person, PersonInsert, PersonUpdate } from '@/types';

const QK = 'personen';

export function usePersonen(): ReturnType<typeof useQuery<Person[]>> {
  return useQuery<Person[]>({
    queryKey: [QK],
    queryFn: async () => {
      const res = await fetch('/api/personen');
      if (!res.ok) throw new Error('Personen konnten nicht geladen werden');
      return res.json() as Promise<Person[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePerson(): ReturnType<typeof useMutation<Person, Error, Omit<PersonInsert, 'company'>>> {
  const qc = useQueryClient();
  return useMutation<Person, Error, Omit<PersonInsert, 'company'>>({
    mutationFn: async (body) => {
      const res = await fetch('/api/personen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? 'Person konnte nicht angelegt werden');
      }
      return res.json() as Promise<Person>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Person angelegt');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdatePerson(): ReturnType<typeof useMutation<Person, Error, { id: string; update: PersonUpdate }>> {
  const qc = useQueryClient();
  return useMutation<Person, Error, { id: string; update: PersonUpdate }>({
    mutationFn: async ({ id, update }) => {
      const res = await fetch(`/api/personen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error('Person konnte nicht aktualisiert werden');
      return res.json() as Promise<Person>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePerson(): ReturnType<typeof useMutation<void, Error, string>> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/personen/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Person konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Person gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}
