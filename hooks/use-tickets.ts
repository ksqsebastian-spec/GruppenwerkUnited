'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket, TicketInsert, TicketUpdate, TicketDatei } from '@/types';

const QK = 'tickets';

export interface TicketsFilter {
  status?: string;
  urgency?: string;
  firma?: string;
}

function buildParams(filter: TicketsFilter): string {
  const p = new URLSearchParams();
  if (filter.status) p.set('status', filter.status);
  if (filter.urgency) p.set('urgency', filter.urgency);
  if (filter.firma) p.set('firma', filter.firma);
  return p.toString() ? '?' + p.toString() : '';
}

// ── Tickets ─────────────────────────────────────────────────────────────────

export function useTickets(filter: TicketsFilter = {}): ReturnType<typeof useQuery<Ticket[]>> {
  return useQuery<Ticket[]>({
    queryKey: [QK, filter],
    queryFn: async () => {
      const res = await fetch('/api/tickets' + buildParams(filter));
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Tickets konnten nicht geladen werden');
      }
      return res.json() as Promise<Ticket[]>;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateTicket(): ReturnType<typeof useMutation<Ticket, Error, TicketInsert>> {
  const qc = useQueryClient();
  return useMutation<Ticket, Error, TicketInsert>({
    mutationFn: async (body) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? 'Ticket konnte nicht angelegt werden');
      }
      return res.json() as Promise<Ticket>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Ticket angelegt');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateTicket(): ReturnType<typeof useMutation<Ticket, Error, { id: string; update: TicketUpdate }>> {
  const qc = useQueryClient();
  return useMutation<Ticket, Error, { id: string; update: TicketUpdate }>({
    mutationFn: async ({ id, update }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error('Ticket konnte nicht aktualisiert werden');
      return res.json() as Promise<Ticket>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteTicket(): ReturnType<typeof useMutation<void, Error, string>> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Ticket konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Ticket gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

// ── Dateien ─────────────────────────────────────────────────────────────────

export function useTicketDateien(ticketId: string | null): ReturnType<typeof useQuery<TicketDatei[]>> {
  return useQuery<TicketDatei[]>({
    queryKey: ['ticket-dateien', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/dateien`);
      if (!res.ok) throw new Error('Dateien konnten nicht geladen werden');
      return res.json() as Promise<TicketDatei[]>;
    },
    enabled: !!ticketId,
    staleTime: 60 * 1000,
  });
}

export function useUploadTicketDatei(): ReturnType<
  typeof useMutation<TicketDatei, Error, { ticketId: string; file: File }>
> {
  const qc = useQueryClient();
  return useMutation<TicketDatei, Error, { ticketId: string; file: File }>({
    mutationFn: async ({ ticketId, file }) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/tickets/${ticketId}/dateien`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Upload fehlgeschlagen');
      }
      return res.json() as Promise<TicketDatei>;
    },
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['ticket-dateien', ticketId] });
      toast.success('Datei hochgeladen');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteTicketDatei(): ReturnType<
  typeof useMutation<void, Error, { ticketId: string; dateiId: string }>
> {
  const qc = useQueryClient();
  return useMutation<void, Error, { ticketId: string; dateiId: string }>({
    mutationFn: async ({ ticketId, dateiId }) => {
      const res = await fetch(`/api/tickets/${ticketId}/dateien/${dateiId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Datei konnte nicht gelöscht werden');
    },
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['ticket-dateien', ticketId] });
      toast.success('Datei gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}
