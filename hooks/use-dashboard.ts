import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useAuth } from '@/components/providers/auth-provider';
import type { DashboardStats, AppointmentWithVehicle, DashboardActivity } from '@/types';

/**
 * Lädt die Dashboard-Statistiken
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fahrzeuganzahl
  const { count: vehicleCount, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (vehicleError) {
    console.error('Fehler beim Laden der Fahrzeuganzahl:', vehicleError);
    throw new Error('Dashboard-Daten konnten nicht geladen werden');
  }

  // Offene Schäden
  const { count: damageCount, error: damageError } = await supabase
    .from('damages')
    .select('*', { count: 'exact', head: true })
    .in('status', ['reported', 'in_repair']);

  if (damageError) {
    console.error('Fehler beim Laden der Schadensanzahl:', damageError);
    throw new Error('Dashboard-Daten konnten nicht geladen werden');
  }

  // Kosten dieses Monats
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: costs, error: costError } = await supabase
    .from('costs')
    .select('amount')
    .gte('date', startOfMonth.toISOString());

  if (costError) {
    console.error('Fehler beim Laden der Kosten:', costError);
    throw new Error('Dashboard-Daten konnten nicht geladen werden');
  }

  const totalCosts = costs?.reduce((sum, cost) => sum + (cost.amount || 0), 0) ?? 0;

  // Aktive Fahrer
  const { count: driverCount, error: driverError } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (driverError) {
    console.error('Fehler beim Laden der Fahreranzahl:', driverError);
    throw new Error('Dashboard-Daten konnten nicht geladen werden');
  }

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
async function fetchWarningAppointments(): Promise<AppointmentWithVehicle[]> {
  // Termine die überfällig sind oder in den nächsten 30 Tagen fällig werden
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model)
    `)
    .neq('status', 'completed')
    .lte('due_date', thirtyDaysFromNow.toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Fehler beim Laden der Warnungen:', error);
    throw new Error('Warnungen konnten nicht geladen werden');
  }

  return (data ?? []) as AppointmentWithVehicle[];
}

/**
 * Lädt die letzten Aktivitäten
 */
async function fetchRecentActivities(): Promise<DashboardActivity[]> {
  // Diese Funktion würde normalerweise aus einer activity_log Tabelle laden
  // Für jetzt erstellen wir eine kombinierte Ansicht aus verschiedenen Tabellen
  const activities: DashboardActivity[] = [];

  // Letzte Fahrzeuge
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, license_plate, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  vehicles?.forEach((v) => {
    activities.push({
      id: `vehicle-${v.id}`,
      type: 'vehicle',
      description: `Fahrzeug ${v.license_plate} hinzugefügt`,
      created_at: v.created_at,
    });
  });

  // Letzte Schäden
  const { data: damages } = await supabase
    .from('damages')
    .select('id, description, created_at, vehicle:vehicles(license_plate)')
    .order('created_at', { ascending: false })
    .limit(3);

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
  const { data: costs } = await supabase
    .from('costs')
    .select('id, type, amount, created_at, vehicle:vehicles(license_plate)')
    .order('created_at', { ascending: false })
    .limit(3);

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

  // Nach Datum sortieren
  return activities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Hook für Dashboard-Statistiken
 */
export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}

/**
 * Hook für Warnungs-Termine
 */
export function useWarningAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'warnings'],
    queryFn: fetchWarningAppointments,
    staleTime: QUERY_STALE_TIMES.appointments,
    enabled: !!user,
  });
}

/**
 * Hook für letzte Aktivitäten
 */
export function useRecentActivities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: fetchRecentActivities,
    staleTime: QUERY_STALE_TIMES.dashboard,
    enabled: !!user,
  });
}
