'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomerKommentar,
  CustomerDatei,
  CustomerPrompt,
  CustomerPromptInsert,
  CustomerPromptUpdate,
  CustomerPromptRendered,
} from '@/types';

const QK_CUSTOMERS = 'kunden';
const QK_PROMPTS = 'kunden-prompts';

async function jsonOrError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(body.error ?? fallback);
}

// ── Kunden ───────────────────────────────────────────────────────────────────

export function useKunden(): UseQueryResult<Customer[], Error> {
  return useQuery<Customer[]>({
    queryKey: [QK_CUSTOMERS],
    queryFn: async () => {
      const res = await fetch('/api/kunden');
      if (!res.ok) return jsonOrError(res, 'Kunden konnten nicht geladen werden');
      return res.json() as Promise<Customer[]>;
    },
    staleTime: 60 * 1000,
  });
}

export function useKunde(id: string | null): UseQueryResult<Customer, Error> {
  return useQuery<Customer>({
    queryKey: [QK_CUSTOMERS, id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/kunden/${id}`);
      if (!res.ok) return jsonOrError(res, 'Kunde konnte nicht geladen werden');
      return res.json() as Promise<Customer>;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateKunde(): UseMutationResult<Customer, Error, CustomerInsert> {
  const qc = useQueryClient();
  return useMutation<Customer, Error, CustomerInsert>({
    mutationFn: async (input) => {
      const res = await fetch('/api/kunden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) return jsonOrError(res, 'Kunde konnte nicht angelegt werden');
      return res.json() as Promise<Customer>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_CUSTOMERS] });
      toast.success('Kunde angelegt');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateKunde(): UseMutationResult<Customer, Error, { id: string; updates: CustomerUpdate }> {
  const qc = useQueryClient();
  return useMutation<Customer, Error, { id: string; updates: CustomerUpdate }>({
    mutationFn: async ({ id, updates }) => {
      const res = await fetch(`/api/kunden/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return jsonOrError(res, 'Kunde konnte nicht aktualisiert werden');
      return res.json() as Promise<Customer>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QK_CUSTOMERS] });
      qc.invalidateQueries({ queryKey: [QK_CUSTOMERS, data.id] });
      toast.success('Kunde gespeichert');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteKunde(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/kunden/${id}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Kunde konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_CUSTOMERS] });
      toast.success('Kunde gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Kommentare ───────────────────────────────────────────────────────────────

export function useKundenKommentare(customerId: string | null): UseQueryResult<CustomerKommentar[], Error> {
  return useQuery<CustomerKommentar[]>({
    queryKey: ['kunden-kommentare', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const res = await fetch(`/api/kunden/${customerId}/kommentare`);
      if (!res.ok) return jsonOrError(res, 'Kommentare konnten nicht geladen werden');
      return res.json() as Promise<CustomerKommentar[]>;
    },
  });
}

export function useCreateKundenKommentar(customerId: string): UseMutationResult<CustomerKommentar, Error, string> {
  const qc = useQueryClient();
  return useMutation<CustomerKommentar, Error, string>({
    mutationFn: async (text) => {
      const res = await fetch(`/api/kunden/${customerId}/kommentare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return jsonOrError(res, 'Kommentar konnte nicht gespeichert werden');
      return res.json() as Promise<CustomerKommentar>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kunden-kommentare', customerId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteKundenKommentar(customerId: string): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (kid) => {
      const res = await fetch(`/api/kunden/${customerId}/kommentare/${kid}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Kommentar konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kunden-kommentare', customerId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Dateien ──────────────────────────────────────────────────────────────────

export function useKundenDateien(customerId: string | null): UseQueryResult<CustomerDatei[], Error> {
  return useQuery<CustomerDatei[]>({
    queryKey: ['kunden-dateien', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const res = await fetch(`/api/kunden/${customerId}/dateien`);
      if (!res.ok) return jsonOrError(res, 'Dateien konnten nicht geladen werden');
      return res.json() as Promise<CustomerDatei[]>;
    },
  });
}

export function useUploadKundenDatei(customerId: string): UseMutationResult<CustomerDatei, Error, File> {
  const qc = useQueryClient();
  return useMutation<CustomerDatei, Error, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/kunden/${customerId}/dateien`, { method: 'POST', body: form });
      if (!res.ok) return jsonOrError(res, 'Datei konnte nicht hochgeladen werden');
      return res.json() as Promise<CustomerDatei>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kunden-dateien', customerId] });
      toast.success('Datei hochgeladen');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteKundenDatei(customerId: string): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (did) => {
      const res = await fetch(`/api/kunden/${customerId}/dateien/${did}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Datei konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kunden-dateien', customerId] });
      toast.success('Datei gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Prompt-Vorlagen ──────────────────────────────────────────────────────────

export function useKundenPrompts(): UseQueryResult<CustomerPrompt[], Error> {
  return useQuery<CustomerPrompt[]>({
    queryKey: [QK_PROMPTS],
    queryFn: async () => {
      const res = await fetch('/api/kunden/prompts');
      if (!res.ok) return jsonOrError(res, 'Vorlagen konnten nicht geladen werden');
      return res.json() as Promise<CustomerPrompt[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateKundenPrompt(): UseMutationResult<CustomerPrompt, Error, CustomerPromptInsert> {
  const qc = useQueryClient();
  return useMutation<CustomerPrompt, Error, CustomerPromptInsert>({
    mutationFn: async (input) => {
      const res = await fetch('/api/kunden/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) return jsonOrError(res, 'Vorlage konnte nicht gespeichert werden');
      return res.json() as Promise<CustomerPrompt>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_PROMPTS] });
      toast.success('Vorlage gespeichert');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateKundenPrompt(): UseMutationResult<CustomerPrompt, Error, { id: string; updates: CustomerPromptUpdate }> {
  const qc = useQueryClient();
  return useMutation<CustomerPrompt, Error, { id: string; updates: CustomerPromptUpdate }>({
    mutationFn: async ({ id, updates }) => {
      const res = await fetch(`/api/kunden/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return jsonOrError(res, 'Vorlage konnte nicht aktualisiert werden');
      return res.json() as Promise<CustomerPrompt>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_PROMPTS] });
      toast.success('Vorlage gespeichert');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteKundenPrompt(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/kunden/prompts/${id}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Vorlage konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_PROMPTS] });
      toast.success('Vorlage gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRenderKundenPrompt(customerId: string): UseMutationResult<CustomerPromptRendered, Error, string> {
  return useMutation<CustomerPromptRendered, Error, string>({
    mutationFn: async (promptId) => {
      const res = await fetch(`/api/kunden/${customerId}/render-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId }),
      });
      if (!res.ok) return jsonOrError(res, 'Prompt konnte nicht erzeugt werden');
      return res.json() as Promise<CustomerPromptRendered>;
    },
    onError: (e) => toast.error(e.message),
  });
}

export async function getKundenDateiDownloadUrl(customerId: string, did: string): Promise<string> {
  const res = await fetch(`/api/kunden/${customerId}/dateien/${did}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Download-Link konnte nicht erstellt werden');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
