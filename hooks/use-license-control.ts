import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchLicenseSettings,
  updateLicenseSettings,
  fetchLicenseInspectors,
  createLicenseInspector,
  updateLicenseInspector,
  archiveLicenseInspector,
  fetchLicenseEmployees,
  fetchLicenseEmployee,
  createLicenseEmployee,
  updateLicenseEmployee,
  archiveLicenseEmployee,
  fetchLicenseChecks,
  createLicenseCheck,
  createBatchLicenseChecks,
  deleteLicenseCheck,
  fetchLicenseControlStats,
  fetchLicenseWarningCount,
} from '@/lib/database/license-control';
import { useAuth } from '@/components/providers/auth-provider';
import type {
  LicenseCheckSettingsUpdate,
  LicenseCheckInspectorInsert,
  LicenseCheckInspectorUpdate,
  LicenseCheckEmployeeInsert,
  LicenseCheckEmployeeUpdate,
  LicenseCheckEmployeeFilters,
  LicenseCheckInsert,
} from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

// ============================================================================
// Einstellungen
// ============================================================================

/**
 * Hook für Führerscheinkontrolle-Einstellungen
 */
export function useLicenseSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-settings'],
    queryFn: fetchLicenseSettings,
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

/**
 * Hook zum Aktualisieren der Einstellungen
 */
export function useUpdateLicenseSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LicenseCheckSettingsUpdate) => updateLicenseSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-settings'] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Einstellungen erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Prüfer
// ============================================================================

/**
 * Hook für alle Prüfer
 */
export function useLicenseInspectors(status?: 'active' | 'archived') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-inspectors', status],
    queryFn: () => fetchLicenseInspectors(status),
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

/**
 * Hook zum Erstellen eines Prüfers
 */
export function useCreateLicenseInspector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LicenseCheckInspectorInsert) => createLicenseInspector(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-inspectors'] });
      toast.success('Prüfer erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Prüfers
 */
export function useUpdateLicenseInspector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LicenseCheckInspectorUpdate }) =>
      updateLicenseInspector(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-inspectors'] });
      toast.success('Prüfer erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Archivieren eines Prüfers
 */
export function useArchiveLicenseInspector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveLicenseInspector(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-inspectors'] });
      toast.success('Prüfer erfolgreich archiviert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Mitarbeiter
// ============================================================================

/**
 * Hook für alle Mitarbeiter mit optionalen Filtern
 */
export function useLicenseEmployees(filters?: LicenseCheckEmployeeFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-employees', filters],
    queryFn: () => fetchLicenseEmployees(filters),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

/**
 * Hook für einen einzelnen Mitarbeiter
 */
export function useLicenseEmployee(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-employee', id],
    queryFn: () => fetchLicenseEmployee(id!),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.licenseControl,
  });
}

/**
 * Hook zum Erstellen eines Mitarbeiters
 */
export function useCreateLicenseEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LicenseCheckEmployeeInsert) => createLicenseEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Mitarbeiter erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Aktualisieren eines Mitarbeiters
 */
export function useUpdateLicenseEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LicenseCheckEmployeeUpdate }) =>
      updateLicenseEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-employee', variables.id] });
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Archivieren eines Mitarbeiters
 */
export function useArchiveLicenseEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveLicenseEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Mitarbeiter erfolgreich archiviert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Kontrollen
// ============================================================================

/**
 * Hook für Kontrollen eines Mitarbeiters
 */
export function useLicenseChecks(employeeId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-checks', employeeId],
    queryFn: () => fetchLicenseChecks(employeeId!),
    enabled: !!employeeId && !!user,
    staleTime: QUERY_STALE_TIMES.licenseControl,
  });
}

/**
 * Hook zum Erstellen einer Kontrolle
 */
export function useCreateLicenseCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LicenseCheckInsert) => createLicenseCheck(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['license-checks', variables.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['license-employee', variables.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Kontrolle erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Erstellen von Sammelkontrollen
 */
export function useCreateBatchLicenseChecks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeIds,
      checkData,
    }: {
      employeeIds: string[];
      checkData: Omit<LicenseCheckInsert, 'employee_id'>;
    }) => createBatchLicenseChecks(employeeIds, checkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-checks'] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Sammelkontrolle erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook zum Löschen einer Kontrolle
 */
export function useDeleteLicenseCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      deleteLicenseCheck(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['license-checks', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['license-employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Kontrolle erfolgreich gelöscht');
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
 * Hook für Führerscheinkontrolle-Statistiken
 */
export function useLicenseControlStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-stats'],
    queryFn: fetchLicenseControlStats,
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

/**
 * Hook für Sidebar-Badge (Anzahl fälliger/überfälliger Kontrollen)
 */
export function useLicenseWarningCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-warning-count'],
    queryFn: fetchLicenseWarningCount,
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}
