import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type {
  LicenseCheckSettings,
  LicenseCheckSettingsUpdate,
  LicenseCheckInspector,
  LicenseCheckInspectorInsert,
  LicenseCheckInspectorUpdate,
  LicenseCheckEmployee,
  LicenseCheckEmployeeInsert,
  LicenseCheckEmployeeUpdate,
  LicenseCheckEmployeeFilters,
  LicenseCheck,
  LicenseCheckInsert,
  LicenseControlStats,
} from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export function useLicenseSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['license-settings'],
    queryFn: () => apiFetch<LicenseCheckSettings>('/api/license-control/settings'),
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

export function useUpdateLicenseSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LicenseCheckSettingsUpdate) =>
      apiFetch<LicenseCheckSettings>('/api/license-control/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-settings'] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Einstellungen erfolgreich gespeichert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLicenseInspectors(status?: 'active' | 'archived') {
  const { user } = useAuth();
  const params = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['license-inspectors', status],
    queryFn: () => apiFetch<LicenseCheckInspector[]>(`/api/license-control/inspectors${params}`),
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

export function useCreateLicenseInspector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LicenseCheckInspectorInsert) =>
      apiFetch<LicenseCheckInspector>('/api/license-control/inspectors', { ...json(data), method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-inspectors'] });
      toast.success('Prüfer erfolgreich angelegt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLicenseInspector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LicenseCheckInspectorUpdate }) =>
      apiFetch<LicenseCheckInspector>(`/api/license-control/inspectors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-inspectors'] });
      toast.success('Prüfer erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useArchiveLicenseInspector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/license-control/inspectors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-inspectors'] });
      toast.success('Prüfer erfolgreich archiviert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLicenseEmployees(filters?: LicenseCheckEmployeeFilters) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.companyId) params.set('companyId', filters.companyId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.checkStatus) params.set('checkStatus', filters.checkStatus);

  return useQuery({
    queryKey: ['license-employees', filters],
    queryFn: () => apiFetch<LicenseCheckEmployee[]>(`/api/license-control/employees?${params}`),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

export function useLicenseEmployee(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['license-employee', id],
    queryFn: () => apiFetch<LicenseCheckEmployee>(`/api/license-control/employees/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.licenseControl,
  });
}

export function useCreateLicenseEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LicenseCheckEmployeeInsert) =>
      apiFetch<LicenseCheckEmployee>('/api/license-control/employees', { ...json(data), method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Mitarbeiter erfolgreich angelegt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLicenseEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LicenseCheckEmployeeUpdate }) =>
      apiFetch<LicenseCheckEmployee>(`/api/license-control/employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-employee', variables.id] });
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useArchiveLicenseEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/license-control/employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Mitarbeiter erfolgreich archiviert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLicenseChecks(employeeId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['license-checks', employeeId],
    queryFn: () => apiFetch<LicenseCheck[]>(`/api/license-control/checks?employeeId=${employeeId}`),
    enabled: !!employeeId && !!user,
    staleTime: QUERY_STALE_TIMES.licenseControl,
  });
}

export function useCreateLicenseCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LicenseCheckInsert) =>
      apiFetch<LicenseCheck>('/api/license-control/checks', { ...json(data), method: 'POST' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['license-checks', variables.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['license-employee', variables.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Kontrolle erfolgreich gespeichert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateBatchLicenseChecks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeIds, checkData }: { employeeIds: string[]; checkData: Omit<LicenseCheckInsert, 'employee_id'> }) =>
      apiFetch<LicenseCheck[]>('/api/license-control/checks', { ...json({ employeeIds, checkData }), method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-checks'] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Sammelkontrolle erfolgreich gespeichert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteLicenseCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      apiFetch<{ success: boolean }>('/api/license-control/checks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['license-checks', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['license-employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['license-employees'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      queryClient.invalidateQueries({ queryKey: ['license-warning-count'] });
      toast.success('Kontrolle erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLicenseControlStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['license-stats'],
    queryFn: () => apiFetch<{ stats: LicenseControlStats }>('/api/license-control/stats').then((d) => d.stats),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

export function useLicenseWarningCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['license-warning-count'],
    queryFn: () => apiFetch<{ warningCount: number }>('/api/license-control/stats').then((d) => d.warningCount),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}
