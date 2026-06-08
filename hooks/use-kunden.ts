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
  CustomerMapping,
  CustomerMappingEintrag,
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

export function useUploadKundenPromptVorlage(): UseMutationResult<CustomerPrompt, Error, { id: string; file: File }> {
  const qc = useQueryClient();
  return useMutation<CustomerPrompt, Error, { id: string; file: File }>({
    mutationFn: async ({ id, file }) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/kunden/prompts/${id}/vorlage`, { method: 'POST', body: form });
      if (!res.ok) return jsonOrError(res, 'Vorlage-Datei konnte nicht hochgeladen werden');
      return res.json() as Promise<CustomerPrompt>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_PROMPTS] });
      toast.success('Vorlage hochgeladen');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRemoveKundenPromptVorlage(): UseMutationResult<CustomerPrompt, Error, string> {
  const qc = useQueryClient();
  return useMutation<CustomerPrompt, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/kunden/prompts/${id}/vorlage`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Anhang konnte nicht entfernt werden');
      return res.json() as Promise<CustomerPrompt>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_PROMPTS] });
      toast.success('Anhang entfernt');
    },
    onError: (e) => toast.error(e.message),
  });
}

export async function getKundenPromptVorlageDownloadUrl(promptId: string): Promise<string> {
  const res = await fetch(`/api/kunden/prompts/${promptId}/vorlage`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Download-Link konnte nicht erstellt werden');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function useRenderKundenPrompt(
  customerId: string,
): UseMutationResult<CustomerPromptRendered, Error, { promptId: string; encode?: boolean }> {
  const qc = useQueryClient();
  return useMutation<CustomerPromptRendered, Error, { promptId: string; encode?: boolean }>({
    mutationFn: async ({ promptId, encode }) => {
      const res = await fetch(`/api/kunden/${customerId}/render-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, encode: !!encode }),
      });
      if (!res.ok) return jsonOrError(res, 'Prompt konnte nicht erzeugt werden');
      return res.json() as Promise<CustomerPromptRendered>;
    },
    onSuccess: (result) => {
      // Wenn neue Datenkodierungs-Einträge angelegt wurden, deren Cache invalidieren
      if (result.encoded && result.mapping && result.mapping.length > 0) {
        qc.invalidateQueries({ queryKey: ['datenkodierungen'] });
      }
    },
    onError: (e) => toast.error(e.message),
  });
}

export interface LeadImportErgebnis {
  created: number;
  skipped: number;
  errors: string[];
}

export function useImportLeadsAlsKunden(): UseMutationResult<LeadImportErgebnis, Error, string[]> {
  const qc = useQueryClient();
  return useMutation<LeadImportErgebnis, Error, string[]>({
    mutationFn: async (leadIds) => {
      const res = await fetch('/api/kunden/import-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: leadIds }),
      });
      if (!res.ok) return jsonOrError(res, 'Übernahme fehlgeschlagen');
      return res.json() as Promise<LeadImportErgebnis>;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: [QK_CUSTOMERS] });
      const text = `${r.created} übernommen, ${r.skipped} übersprungen`;
      if (r.errors.length > 0) toast.warning(`${text} · ${r.errors.length} Fehler`);
      else toast.success(text);
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Gespeicherte Code-Mappings ───────────────────────────────────────────────

export function useKundenMappings(customerId: string | null): UseQueryResult<CustomerMapping[], Error> {
  return useQuery<CustomerMapping[]>({
    queryKey: ['kunden-mappings', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const res = await fetch(`/api/kunden/${customerId}/mappings`);
      if (!res.ok) return jsonOrError(res, 'Mappings konnten nicht geladen werden');
      return res.json() as Promise<CustomerMapping[]>;
    },
  });
}

export function useCreateKundenMapping(
  customerId: string,
): UseMutationResult<CustomerMapping, Error, { anlass: string; eintraege: CustomerMappingEintrag[] }> {
  const qc = useQueryClient();
  return useMutation<CustomerMapping, Error, { anlass: string; eintraege: CustomerMappingEintrag[] }>({
    mutationFn: async ({ anlass, eintraege }) => {
      const res = await fetch(`/api/kunden/${customerId}/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anlass, eintraege }),
      });
      if (!res.ok) return jsonOrError(res, 'Mapping konnte nicht gespeichert werden');
      return res.json() as Promise<CustomerMapping>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kunden-mappings', customerId] });
      toast.success('Mapping beim Kunden gespeichert');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteKundenMapping(customerId: string): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (mid) => {
      const res = await fetch(`/api/kunden/${customerId}/mappings/${mid}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Mapping konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kunden-mappings', customerId] });
      toast.success('Mapping gelöscht');
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
