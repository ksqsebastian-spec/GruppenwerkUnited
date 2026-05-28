import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import type { AutomatisierungsKnoten, AutomatisierungsKnotenInsert, AutomatisierungsKnotenUpdate } from '@/types';

const QUERY_KEY = 'automationen';

type KnotenInsertVars = Omit<AutomatisierungsKnotenInsert, 'company'>;
type KnotenUpdateVars = { id: string; updates: AutomatisierungsKnotenUpdate };
type KnotenPositionVars = { id: string; x: number; y: number };
type OptimistischesContext = { previous?: AutomatisierungsKnoten[] };

/** Liest die Fehlermeldung aus einer fehlgeschlagenen API-Antwort. */
async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? fallback;
}

/**
 * Lädt alle aktiven Automatisierungsknoten der aktuellen Firma als flache Liste.
 */
export function useAutomatisierungsknoten() {
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useQuery<AutomatisierungsKnoten[]>({
    queryKey: [QUERY_KEY, companyId],
    queryFn: async () => {
      const res = await fetch('/api/automationen');
      if (!res.ok) {
        throw new Error(await readError(res, 'Automatisierungen konnten nicht geladen werden'));
      }
      return res.json() as Promise<AutomatisierungsKnoten[]>;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Erstellt einen neuen Knoten im Canvas der aktuellen Firma.
 */
export function useCreateKnoten() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation<AutomatisierungsKnoten, Error, KnotenInsertVars>({
    mutationFn: async (data: KnotenInsertVars) => {
      const res = await fetch('/api/automationen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(await readError(res, 'Automatisierungsknoten konnte nicht erstellt werden'));
      }
      return res.json() as Promise<AutomatisierungsKnoten>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
      toast.success('Knoten erstellt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Aktualisiert einen Knoten mit optimistischem Update.
 */
export function useUpdateKnoten() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation<AutomatisierungsKnoten, Error, KnotenUpdateVars, OptimistischesContext>({
    mutationFn: async ({ id, updates }: KnotenUpdateVars) => {
      const res = await fetch(`/api/automationen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        throw new Error(await readError(res, 'Automatisierungsknoten konnte nicht aktualisiert werden'));
      }
      return res.json() as Promise<AutomatisierungsKnoten>;
    },
    onMutate: async ({ id, updates }: KnotenUpdateVars): Promise<OptimistischesContext> => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, companyId] });
      const previous = queryClient.getQueryData<AutomatisierungsKnoten[]>([QUERY_KEY, companyId]);
      queryClient.setQueryData<AutomatisierungsKnoten[]>(
        [QUERY_KEY, companyId],
        (old) => old?.map((k) => (k.id === id ? { ...k, ...updates } : k)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, companyId], ctx.previous);
      }
      toast.error('Knoten konnte nicht aktualisiert werden');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
      toast.success('Knoten gespeichert');
    },
  });
}

/**
 * Speichert die Canvas-Position nach Drag.
 * Optimistisches Update, kein Toast — wird häufig aufgerufen.
 */
export function useUpdateKnotenPosition() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation<void, Error, KnotenPositionVars, OptimistischesContext>({
    mutationFn: async ({ id, x, y }: KnotenPositionVars) => {
      const res = await fetch(`/api/automationen/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_x: x, position_y: y }),
      });
      if (!res.ok) {
        throw new Error(await readError(res, 'Position konnte nicht gespeichert werden'));
      }
    },
    onMutate: async ({ id, x, y }: KnotenPositionVars): Promise<OptimistischesContext> => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, companyId] });
      const previous = queryClient.getQueryData<AutomatisierungsKnoten[]>([QUERY_KEY, companyId]);
      queryClient.setQueryData<AutomatisierungsKnoten[]>(
        [QUERY_KEY, companyId],
        (old) => old?.map((k) => (k.id === id ? { ...k, position_x: x, position_y: y } : k)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, companyId], ctx.previous);
      }
    },
  });
}

/**
 * Löscht einen Knoten und kaskadierend alle seine Kinder.
 */
export function useDeleteKnoten() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automationen/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(await readError(res, 'Automatisierungsknoten konnte nicht gelöscht werden'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
      toast.success('Knoten gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
