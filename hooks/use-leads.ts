'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { Lead, LeadInsert, LeadUpdate, LeadKommentar, LeadDatei } from '@/types';

const QK = 'leads';

// ── Filter-State ──────────────────────────────────────────────────────────────

export interface LeadsFilter {
  search?: string;
  status?: string;
  prioritaet?: string;
  branche?: string;
}

function buildParams(filter: LeadsFilter): string {
  const p = new URLSearchParams();
  if (filter.search) p.set('search', filter.search);
  if (filter.status) p.set('status', filter.status);
  if (filter.prioritaet) p.set('prioritaet', filter.prioritaet);
  if (filter.branche) p.set('branche', filter.branche);
  return p.toString() ? '?' + p.toString() : '';
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export function useLeads(filter: LeadsFilter = {}): ReturnType<typeof useQuery<Lead[]>> {
  const { company } = useAuth();
  return useQuery<Lead[]>({
    queryKey: [QK, company?.companyId, filter],
    queryFn: async () => {
      const res = await fetch('/api/leads' + buildParams(filter));
      if (!res.ok) throw new Error('Leads konnten nicht geladen werden');
      return res.json() as Promise<Lead[]>;
    },
    enabled: !!company?.companyId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateLead(): ReturnType<typeof useMutation<Lead, Error, Omit<LeadInsert, 'company'>>> {
  const qc = useQueryClient();
  const { company } = useAuth();
  return useMutation<Lead, Error, Omit<LeadInsert, 'company'>>({
    mutationFn: async (body) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Lead konnte nicht angelegt werden');
      return res.json() as Promise<Lead>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, company?.companyId] });
      toast.success('Lead angelegt');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateLead(): ReturnType<typeof useMutation<Lead, Error, { id: string; update: LeadUpdate }>> {
  const qc = useQueryClient();
  const { company } = useAuth();
  return useMutation<Lead, Error, { id: string; update: LeadUpdate }>({
    mutationFn: async ({ id, update }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error('Lead konnte nicht aktualisiert werden');
      return res.json() as Promise<Lead>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, company?.companyId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteLead(): ReturnType<typeof useMutation<void, Error, string>> {
  const qc = useQueryClient();
  const { company } = useAuth();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Lead konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, company?.companyId] });
      toast.success('Lead gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useImportLeads(): ReturnType<typeof useMutation<{ imported: number; total: number }, Error, File>> {
  const qc = useQueryClient();
  const { company } = useAuth();
  return useMutation<{ imported: number; total: number }, Error, File>({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/leads/import', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Import fehlgeschlagen');
      }
      return res.json() as Promise<{ imported: number; total: number }>;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [QK, company?.companyId] });
      toast.success(`${result.imported} Leads importiert`);
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Kommentare ────────────────────────────────────────────────────────────────

export function useKommentare(leadId: string | null): ReturnType<typeof useQuery<LeadKommentar[]>> {
  return useQuery<LeadKommentar[]>({
    queryKey: ['lead-kommentare', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/kommentare`);
      if (!res.ok) throw new Error('Kommentare konnten nicht geladen werden');
      return res.json() as Promise<LeadKommentar[]>;
    },
    enabled: !!leadId,
    staleTime: 60 * 1000,
  });
}

export function useAddKommentar(): ReturnType<typeof useMutation<LeadKommentar, Error, { leadId: string; text: string }>> {
  const qc = useQueryClient();
  return useMutation<LeadKommentar, Error, { leadId: string; text: string }>({
    mutationFn: async ({ leadId, text }) => {
      const res = await fetch(`/api/leads/${leadId}/kommentare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Kommentar konnte nicht gespeichert werden');
      return res.json() as Promise<LeadKommentar>;
    },
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: ['lead-kommentare', leadId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteKommentar(): ReturnType<typeof useMutation<void, Error, { leadId: string; kommentarId: string }>> {
  const qc = useQueryClient();
  return useMutation<void, Error, { leadId: string; kommentarId: string }>({
    mutationFn: async ({ leadId, kommentarId }) => {
      const res = await fetch(`/api/leads/${leadId}/kommentare/${kommentarId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Kommentar konnte nicht gelöscht werden');
    },
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: ['lead-kommentare', leadId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Dateien ───────────────────────────────────────────────────────────────────

export function useDateien(leadId: string | null): ReturnType<typeof useQuery<LeadDatei[]>> {
  return useQuery<LeadDatei[]>({
    queryKey: ['lead-dateien', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/dateien`);
      if (!res.ok) throw new Error('Dateien konnten nicht geladen werden');
      return res.json() as Promise<LeadDatei[]>;
    },
    enabled: !!leadId,
    staleTime: 60 * 1000,
  });
}

export function useUploadDatei(): ReturnType<typeof useMutation<LeadDatei, Error, { leadId: string; file: File }>> {
  const qc = useQueryClient();
  return useMutation<LeadDatei, Error, { leadId: string; file: File }>({
    mutationFn: async ({ leadId, file }) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/leads/${leadId}/dateien`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Upload fehlgeschlagen');
      }
      return res.json() as Promise<LeadDatei>;
    },
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: ['lead-dateien', leadId] });
      toast.success('Datei hochgeladen');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteDatei(): ReturnType<typeof useMutation<void, Error, { leadId: string; dateiId: string }>> {
  const qc = useQueryClient();
  return useMutation<void, Error, { leadId: string; dateiId: string }>({
    mutationFn: async ({ leadId, dateiId }) => {
      const res = await fetch(`/api/leads/${leadId}/dateien/${dateiId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Datei konnte nicht gelöscht werden');
    },
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: ['lead-dateien', leadId] });
      toast.success('Datei gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useExportToDatenkodierung(): ReturnType<typeof useMutation<{ code: string; id: string }, Error, string>> {
  return useMutation<{ code: string; id: string }, Error, string>({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`/api/leads/${leadId}/export-datenkodierung`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Export fehlgeschlagen');
      }
      return res.json() as Promise<{ code: string; id: string }>;
    },
  });
}
