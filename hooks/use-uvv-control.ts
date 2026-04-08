import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchUvvSettings,
  updateUvvSettings,
  fetchUvvInstructors,
  createUvvInstructor,
  updateUvvInstructor,
  archiveUvvInstructor,
  fetchDriversWithUvvStatus,
  fetchDriverWithUvvStatus,
  fetchUvvChecks,
  createUvvCheck,
  createBatchUvvChecks,
  deleteUvvCheck,
  fetchUvvControlStats,
  fetchUvvWarningCount,
} from '@/lib/database/uvv-control';
import { useAuth } from '@/components/providers/auth-provider';
import type {
  UvvSettingsUpdate,
  UvvInstructorInsert,
  UvvInstructorUpdate,
  UvvCheckInsert,
  UvvDriverFilters,
} from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

// ============================================================================
// Einstellungen
// ============================================================================

/**
 * Hook für UVV-Einstellungen
 */
export function useUvvSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-settings'],
    queryFn: fetchUvvSettings,
    staleTime: QUERY_STALE_TIMES.licenseSettings, // Gleiche Cache-Zeit wie bei License
    enabled: !!user,
  });
}

/**
 * Hook zum Aktualisieren der UVV-Einstellungen
 */
export function useUpdateUvvSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UvvSettingsUpdate) => updateUvvSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-settings'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('UVV-Einstellungen erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Unterweisende
// ============================================================================

/**
 * Hook für alle Unterweisenden
 */
export function useUvvInstructors(status?: 'active' | 'archived') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-instructors', status],
    queryFn: () => fetchUvvInstructors(status),
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

/**
 * Hook zum Erstellen eines Unterweisenden
 */
export function useCreateUvvInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UvvInstructorInsert) => createUvvInstructor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-instructors'] });
      toast.success('Unterweisender erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Unterweisenden
 */
export function useUpdateUvvInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UvvInstructorUpdate) =>
      updateUvvInstructor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-instructors'] });
      toast.success('Unterweisender erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Archivieren eines Unterweisenden
 */
export function useArchiveUvvInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveUvvInstructor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-instructors'] });
      toast.success('Unterweisender erfolgreich archiviert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Fahrer mit UVV-Status
// ============================================================================

/**
 * Hook für alle Fahrer mit UVV-Status
 */
export function useDriversWithUvvStatus(filters?: UvvDriverFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-drivers', filters],
    queryFn: () => fetchDriversWithUvvStatus(filters),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

/**
 * Hook für einen einzelnen Fahrer mit UVV-Status
 */
export function useDriverWithUvvStatus(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-driver', id],
    queryFn: () => fetchDriverWithUvvStatus(id!),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user && !!id,
  });
}

// ============================================================================
// UVV-Unterweisungen
// ============================================================================

/**
 * Hook für alle UVV-Unterweisungen eines Fahrers
 */
export function useUvvChecks(driverId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-checks', driverId],
    queryFn: () => fetchUvvChecks(driverId!),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user && !!driverId,
  });
}

/**
 * Hook zum Erstellen einer UVV-Unterweisung
 */
export function useCreateUvvCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UvvCheckInsert) => createUvvCheck(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-driver', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['uvv-checks', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('UVV-Unterweisung erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Erstellen mehrerer UVV-Unterweisungen (Sammel-Unterweisung)
 */
export function useCreateBatchUvvChecks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      driverIds,
      checkData,
    }: {
      driverIds: string[];
      checkData: Omit<UvvCheckInsert, 'driver_id'>;
    }) => createBatchUvvChecks(driverIds, checkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('Sammel-Unterweisung erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen einer UVV-Unterweisung
 */
export function useDeleteUvvCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUvvCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-checks'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('UVV-Unterweisung erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Statistiken & Dashboard
// ============================================================================

/**
 * Hook für UVV-Statistiken
 */
export function useUvvControlStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-stats'],
    queryFn: fetchUvvControlStats,
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

/**
 * Hook für die Anzahl der Fahrer mit fälligen UVV-Unterweisungen
 * Wird für das Sidebar-Badge verwendet
 */
export function useUvvWarningCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['uvv-warning-count'],
    queryFn: fetchUvvWarningCount,
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}
