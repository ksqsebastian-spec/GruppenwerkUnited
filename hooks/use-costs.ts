import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchCost,
  fetchCostTypes,
  fetchCosts,
  fetchCostsThisMonth,
  createCost,
  updateCost,
  deleteCost,
} from '@/lib/database/costs';
import { useAuth } from '@/components/providers/auth-provider';
import type { CostInsert, CostUpdate, CostFilters } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Hook für einen einzelnen Kosteneintrag
 */
export function useCost(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cost', id],
    queryFn: () => fetchCost(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.costs,
  });
}

/**
 * Hook für alle Kostentypen
 */
export function useCostTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cost-types'],
    queryFn: fetchCostTypes,
    staleTime: 30 * 60 * 1000, // 30 Minuten - Typen ändern sich selten
    enabled: !!user,
  });
}

/**
 * Hook für alle Kosten mit optionalen Filtern
 */
export function useCosts(filters?: CostFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['costs', filters],
    queryFn: () => fetchCosts(filters),
    staleTime: QUERY_STALE_TIMES.costs,
    enabled: !!user,
  });
}

/**
 * Hook für die Kosten des aktuellen Monats (Dashboard)
 */
export function useCostsThisMonth() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['costs', 'thisMonth'],
    queryFn: fetchCostsThisMonth,
    staleTime: QUERY_STALE_TIMES.costs,
    enabled: !!user,
  });
}

/**
 * Hook zum Erstellen eines Kosteneintrags
 */
export function useCreateCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CostInsert) => createCost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Kosten erfolgreich erfasst');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Kosteneintrags
 */
export function useUpdateCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CostUpdate }) => updateCost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['cost', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Kosteneintrag erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen eines Kosteneintrags
 */
export function useDeleteCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Kosteneintrag erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
