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

export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const data = await fetchDashboard();
      return data.stats;
    },
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}

export function useWarningAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'warnings'],
    queryFn: async () => {
      const data = await fetchDashboard();
      return data.warningAppointments;
    },
    staleTime: QUERY_STALE_TIMES.appointments,
    enabled: !!user,
  });
}

export function useRecentActivities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: async () => {
      const data = await fetchDashboard();
      return data.recentActivities;
    },
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}
