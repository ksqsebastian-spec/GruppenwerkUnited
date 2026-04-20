import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useAuth } from '@/components/providers/auth-provider';
import { useFuhrparkCompanyId } from '@/hooks/use-fuhrpark-company';
import type { DashboardStats, AppointmentWithVehicle, DashboardActivity } from '@/types';

/**
 * Holt Vehicle-IDs für eine Firma (Hilfsfunktion für gefilterte Sub-Queries)
 */
async function fetchCompanyVehicleIds(companyId: string): Promise<string[]> {
  const { data } = await supabase
    .from('vehicles')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active');
  return (data ?? []).map((v) => v.id);
}

/**
 * Lädt die Dashboard-Statistiken
 */
async function fetchDashboardStats(companyId?: string): Promise<DashboardStats> {
  // Fahrzeuganzahl (direkt nach company_id filterbar)
  let vehicleQuery = supabase
    .from('vehicles')
    .select('id', { count: 'exact' })
    .eq('status', 'active');
  if (companyId) vehicleQuery = vehicleQuery.eq('company_id', companyId);
  const { data: vehicleData, count: vehicleCount } = await vehicleQuery;

  // Fahrer (direkt nach company_id filterbar)
  let driverQuery = supabase
    .from('drivers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');
  if (companyId) driverQuery = driverQuery.eq('company_id', companyId);
  const { count: driverCount } = await driverQuery;

  // Fahrzeug-IDs für Sub-Queries bei Schäden und Kosten
  const vehicleIds = companyId
    ? (vehicleData ?? []).map((v) => v.id)
    : null;

  // Offene Schäden
  let damageQuery = supabase
    .from('damages')
    .select('id', { count: 'exact', head: true })
    .in('status', ['reported', 'in_repair']);
  if (vehicleIds !== null) {
    if (vehicleIds.length === 0) {
      return { vehicleCount: 0, openDamages: 0, costsThisMonth: 0, driverCount: driverCount ?? 0 };
    }
    damageQuery = damageQuery.in('vehicle_id', vehicleIds);
  }
  const { count: damageCount } = await damageQuery;

  // Kosten dieses Monats
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let costQuery = supabase
    .from('costs')
    .select('amount')
    .gte('date', startOfMonth.toISOString());
  if (vehicleIds !== null && vehicleIds.length > 0) {
    costQuery = costQuery.in('vehicle_id', vehicleIds);
  }
  const { data: costs } = await costQuery;
  const totalCosts = costs?.reduce((sum, cost) => sum + (cost.amount || 0), 0) ?? 0;

  return {
    vehicleCount: vehicleCount ?? 0,
    openDamages: damageCount ?? 0,
    costsThisMonth: totalCosts,
    driverCount: driverCount ?? 0,
  };
}

/**
 * Lädt überfällige und bald fällige Termine
 */
async function fetchWarningAppointments(companyId?: string): Promise<AppointmentWithVehicle[]> {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  let query = supabase
    .from('appointments')
    .select('*, vehicle:vehicles(id, license_plate, brand, model)')
    .neq('status', 'completed')
    .lte('due_date', thirtyDaysFromNow.toISOString())
    .order('due_date', { ascending: true });

  if (companyId) {
    const vehicleIds = await fetchCompanyVehicleIds(companyId);
    if (vehicleIds.length === 0) return [];
    query = query.in('vehicle_id', vehicleIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Fehler beim Laden der Warnungen:', error);
    throw new Error('Warnungen konnten nicht geladen werden');
  }

  return (data ?? []) as AppointmentWithVehicle[];
}

/**
 * Lädt die letzten Aktivitäten
 */
async function fetchRecentActivities(companyId?: string): Promise<DashboardActivity[]> {
  const activities: DashboardActivity[] = [];
  const vehicleIds = companyId ? await fetchCompanyVehicleIds(companyId) : null;

  // Letzte Fahrzeuge
  let vehicleQuery = supabase
    .from('vehicles')
    .select('id, license_plate, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  if (companyId) vehicleQuery = vehicleQuery.eq('company_id', companyId);
  const { data: vehicles } = await vehicleQuery;

  vehicles?.forEach((v) => {
    activities.push({
      id: `vehicle-${v.id}`,
      type: 'vehicle',
      description: `Fahrzeug ${v.license_plate} hinzugefügt`,
      created_at: v.created_at,
    });
  });

  if (!vehicleIds || vehicleIds.length > 0) {
    // Letzte Schäden
    let damageQuery = supabase
      .from('damages')
      .select('id, description, created_at, vehicle:vehicles(license_plate)')
      .order('created_at', { ascending: false })
      .limit(3);
    if (vehicleIds) damageQuery = damageQuery.in('vehicle_id', vehicleIds);
    const { data: damages } = await damageQuery;

    damages?.forEach((d) => {
      const vehicleData = d.vehicle as unknown;
      const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
      const licensePlate = (vehicle as { license_plate?: string })?.license_plate ?? 'Unbekannt';
      activities.push({
        id: `damage-${d.id}`,
        type: 'damage',
        description: `Schaden gemeldet: ${d.description?.substring(0, 50)}${(d.description?.length ?? 0) > 50 ? '...' : ''} (${licensePlate})`,
        created_at: d.created_at,
      });
    });

    // Letzte Kosten
    let costQuery = supabase
      .from('costs')
      .select('id, type, amount, created_at, vehicle:vehicles(license_plate)')
      .order('created_at', { ascending: false })
      .limit(3);
    if (vehicleIds) costQuery = costQuery.in('vehicle_id', vehicleIds);
    const { data: costs } = await costQuery;

    costs?.forEach((c) => {
      const vehicleData = c.vehicle as unknown;
      const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
      const licensePlate = (vehicle as { license_plate?: string })?.license_plate ?? 'Unbekannt';
      activities.push({
        id: `cost-${c.id}`,
        type: 'cost',
        description: `Kosten: ${c.amount?.toFixed(2)} € (${licensePlate})`,
        created_at: c.created_at,
      });
    });
  }

  return activities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Hook für Dashboard-Statistiken
 */
export function useDashboardStats() {
  const { user, company } = useAuth();
  const { companyId, isLoading: companyLoading } = useFuhrparkCompanyId();

  return useQuery({
    queryKey: ['dashboard', 'stats', companyId],
    queryFn: () => fetchDashboardStats(companyId ?? undefined),
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user && (!company || company.isAdmin || (!!companyId && !companyLoading)),
  });
}

/**
 * Hook für Warnungs-Termine
 */
export function useWarningAppointments() {
  const { user, company } = useAuth();
  const { companyId, isLoading: companyLoading } = useFuhrparkCompanyId();

  return useQuery({
    queryKey: ['dashboard', 'warnings', companyId],
    queryFn: () => fetchWarningAppointments(companyId ?? undefined),
    staleTime: QUERY_STALE_TIMES.appointments,
    enabled: !!user && (!company || company.isAdmin || (!!companyId && !companyLoading)),
  });
}

/**
 * Hook für letzte Aktivitäten
 */
export function useRecentActivities() {
  const { user, company } = useAuth();
  const { companyId, isLoading: companyLoading } = useFuhrparkCompanyId();

  return useQuery({
    queryKey: ['dashboard', 'activities', companyId],
    queryFn: () => fetchRecentActivities(companyId ?? undefined),
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user && (!company || company.isAdmin || (!!companyId && !companyLoading)),
  });
}
