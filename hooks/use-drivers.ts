import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchDrivers,
  fetchDriver,
  createDriver,
  updateDriver,
  archiveDriver,
} from '@/lib/database/drivers';
import { useAuth } from '@/components/providers/auth-provider';
import type { DriverInsert, DriverUpdate } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Hook für alle Fahrer mit optionalen Filtern
 */
export function useDrivers(filters?: { companyId?: string; status?: 'active' | 'archived' }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['drivers', filters],
    queryFn: () => fetchDrivers(filters),
    staleTime: QUERY_STALE_TIMES.drivers,
    enabled: !!user,
  });
}

/**
 * Hook für einen einzelnen Fahrer
 */
export function useDriver(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => fetchDriver(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.drivers,
  });
}

/**
 * Hook zum Erstellen eines Fahrers
 */
export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DriverInsert) => createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Fahrer erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Fahrers
 */
export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DriverUpdate }) =>
      updateDriver(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.id] });
      toast.success('Fahrer erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Archivieren eines Fahrers
 */
export function useArchiveDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Fahrer erfolgreich archiviert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
