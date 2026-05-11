import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type {
  UvvSettings,
  UvvSettingsUpdate,
  UvvInstructor,
  UvvInstructorInsert,
  UvvInstructorUpdate,
  UvvCheck,
  UvvCheckInsert,
  UvvControlStats,
  DriverWithUvvStatus,
  UvvDriverFilters,
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

export function useUvvSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['uvv-settings'],
    queryFn: () => apiFetch<UvvSettings>('/api/uvv-control/settings'),
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

export function useUpdateUvvSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UvvSettingsUpdate) =>
      apiFetch<UvvSettings>('/api/uvv-control/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-settings'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('UVV-Einstellungen erfolgreich gespeichert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUvvInstructors(status?: 'active' | 'archived') {
  const { user } = useAuth();
  const params = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['uvv-instructors', status],
    queryFn: () => apiFetch<UvvInstructor[]>(`/api/uvv-control/instructors${params}`),
    staleTime: QUERY_STALE_TIMES.licenseSettings,
    enabled: !!user,
  });
}

export function useCreateUvvInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UvvInstructorInsert) =>
      apiFetch<UvvInstructor>('/api/uvv-control/instructors', { ...json(data), method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-instructors'] });
      toast.success('Unterweisender erfolgreich angelegt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateUvvInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UvvInstructorUpdate) =>
      apiFetch<UvvInstructor>(`/api/uvv-control/instructors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-instructors'] });
      toast.success('Unterweisender erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useArchiveUvvInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/uvv-control/instructors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-instructors'] });
      toast.success('Unterweisender erfolgreich archiviert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDriversWithUvvStatus(filters?: UvvDriverFilters) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.companyId) params.set('companyId', filters.companyId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.uvvStatus) params.set('uvvStatus', filters.uvvStatus);

  return useQuery({
    queryKey: ['uvv-drivers', filters],
    queryFn: () => apiFetch<DriverWithUvvStatus[]>(`/api/uvv-control/drivers?${params}`),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

export function useDriverWithUvvStatus(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['uvv-driver', id],
    queryFn: () => apiFetch<DriverWithUvvStatus>(`/api/uvv-control/drivers/${id}`),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user && !!id,
  });
}

export function useUvvChecks(driverId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['uvv-checks', driverId],
    queryFn: () => apiFetch<UvvCheck[]>(`/api/uvv-control/checks?driverId=${driverId}`),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user && !!driverId,
  });
}

export function useCreateUvvCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UvvCheckInsert) =>
      apiFetch<UvvCheck>('/api/uvv-control/checks', { ...json(data), method: 'POST' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-driver', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['uvv-checks', variables.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('UVV-Unterweisung erfolgreich gespeichert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateBatchUvvChecks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ driverIds, checkData }: { driverIds: string[]; checkData: Omit<UvvCheckInsert, 'driver_id'> }) =>
      apiFetch<UvvCheck[]>('/api/uvv-control/checks', { ...json({ driverIds, checkData }), method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('Sammel-Unterweisung erfolgreich gespeichert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteUvvCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>('/api/uvv-control/checks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvv-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-checks'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['uvv-warning-count'] });
      toast.success('UVV-Unterweisung erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUvvControlStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['uvv-stats'],
    queryFn: () => apiFetch<{ stats: UvvControlStats }>('/api/uvv-control/stats').then((d) => d.stats),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}

export function useUvvWarningCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['uvv-warning-count'],
    queryFn: () => apiFetch<{ warningCount: number }>('/api/uvv-control/stats').then((d) => d.warningCount),
    staleTime: QUERY_STALE_TIMES.licenseControl,
    enabled: !!user,
  });
}
