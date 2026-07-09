import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useAuth } from '@/components/providers/auth-provider';
import type { DashboardStats, AppointmentWithVehicle, DashboardActivity } from '@/types';

interface DashboardResponse {
  stats: DashboardStats;
  warningAppointments: AppointmentWithVehicle[];
  recentActivities: DashboardActivity[];
}

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/fuhrpark/dashboard');
  if (!res.ok) throw new Error('Dashboard-Daten konnten nicht geladen werden');
  return res.json() as Promise<DashboardResponse>;
}

// Gemeinsamer Query-Key + `select`: Alle drei Hooks teilen sich EINEN Request an
// /api/fuhrpark/dashboard (statt drei identische). React Query dedupliziert über
// den identischen Key und liefert jedem Hook nur seinen Ausschnitt.
export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    select: (data) => data.stats,
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}

export function useWarningAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    select: (data) => data.warningAppointments,
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}

export function useRecentActivities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    select: (data) => data.recentActivities,
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}
