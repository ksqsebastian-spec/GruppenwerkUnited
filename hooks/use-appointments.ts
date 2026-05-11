import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import type { AppointmentInsert, AppointmentUpdate, AppointmentFilters, AppointmentType, Appointment, UpcomingAppointments } from '@/types';
import { QUERY_STALE_TIMES } from '@/lib/constants';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Fehler bei der Anfrage');
  }
  return res.json() as Promise<T>;
}

export function useAppointmentTypes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['appointment-types'],
    queryFn: () => apiFetch<AppointmentType[]>('/api/fuhrpark/appointment-types'),
    staleTime: 30 * 60 * 1000,
    enabled: !!user,
  });
}

export function useAppointment(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => apiFetch<Appointment>(`/api/fuhrpark/appointments/${id}`),
    enabled: !!id && !!user,
    staleTime: QUERY_STALE_TIMES.appointments,
  });
}

export function useAppointments(filters?: AppointmentFilters) {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.dueBefore) params.set('dueBefore', filters.dueBefore.toISOString());
  if (filters?.dueAfter) params.set('dueAfter', filters.dueAfter.toISOString());

  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => apiFetch<Appointment[]>(`/api/fuhrpark/appointments?${params}`),
    staleTime: QUERY_STALE_TIMES.appointments,
    enabled: !!user,
  });
}

export function useUpcomingAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => apiFetch<UpcomingAppointments>('/api/fuhrpark/appointments/upcoming'),
    staleTime: QUERY_STALE_TIMES.appointments,
    enabled: !!user,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentInsert) =>
      apiFetch<Appointment>('/api/fuhrpark/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin erfolgreich angelegt');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) =>
      apiFetch<Appointment>(`/api/fuhrpark/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin erfolgreich aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/appointments/${id}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin als erledigt markiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/fuhrpark/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Termin erfolgreich gelöscht');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
