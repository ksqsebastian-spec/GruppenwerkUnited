import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  fetchAutomatisierungsknoten,
  createAutomatisierungsknoten,
  updateAutomatisierungsknoten,
  updateKnotenPosition,
  deleteAutomatisierungsknoten,
} from '@/lib/automationen/queries';
import { useAuth } from '@/components/providers/auth-provider';
import type { AutomatisierungsKnoten, AutomatisierungsKnotenInsert, AutomatisierungsKnotenUpdate } from '@/types';

const QUERY_KEY = 'automationen';

type KnotenInsertVars = Omit<AutomatisierungsKnotenInsert, 'company'>;
type KnotenUpdateVars = { id: string; updates: AutomatisierungsKnotenUpdate };
type KnotenPositionVars = { id: string; x: number; y: number };
type OptimistischesContext = { previous?: AutomatisierungsKnoten[] };

/**
 * Lädt alle aktiven Automatisierungsknoten der aktuellen Firma als flache Liste.
 */
export function useAutomatisierungsknoten() {
  const { company } = useAuth();
  const companyId = company?.companyId ?? '';

  return useQuery<AutomatisierungsKnoten[]>({
    queryKey: [QUERY_KEY, companyId],
    queryFn: () => fetchAutomatisierungsknoten(companyId),
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
    mutationFn: (data: KnotenInsertVars) => createAutomatisierungsknoten(companyId, data),
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
    mutationFn: ({ id, updates }: KnotenUpdateVars) =>
      updateAutomatisierungsknoten(companyId, id, updates),
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
    mutationFn: ({ id, x, y }: KnotenPositionVars) => updateKnotenPosition(id, x, y),
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
    mutationFn: (id: string) => deleteAutomatisierungsknoten(companyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
      toast.success('Knoten gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
