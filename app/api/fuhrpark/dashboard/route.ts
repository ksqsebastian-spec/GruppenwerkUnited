import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(): Promise<NextResponse> {
  try {
    const db = createAdminClient();
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const in30Days = new Date(now);
    in30Days.setDate(now.getDate() + 30);

    const [
      vehicleCountResult,
      openDamagesResult,
      driverCountResult,
      costsResult,
      warningAppointmentsResult,
      vehicleActivitiesResult,
      damageActivitiesResult,
      costActivitiesResult,
    ] = await Promise.all([
      // Anzahl aktiver Fahrzeuge
      db.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      // Anzahl offener Schäden
      db.from('damages').select('*', { count: 'exact', head: true }).in('status', ['reported', 'in_repair']),
      // Anzahl aktiver Fahrer
      db.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      // Kosten im aktuellen Monat
      db.from('costs').select('amount').gte('date', firstOfMonth),
      // Termine mit Warnung (nicht abgeschlossen, fällig innerhalb 30 Tage)
      db.from('appointments')
        .select('*, vehicle:vehicles(id, license_plate, brand, model)')
        .neq('status', 'completed')
        .lte('due_date', in30Days.toISOString())
        .order('due_date', { ascending: true }),
      // Letzte 3 Fahrzeug-Aktivitäten
      db.from('vehicles').select('id, license_plate, created_at').order('created_at', { ascending: false }).limit(3),
      // Letzte 3 Schaden-Aktivitäten
      db.from('damages').select('id, description, created_at, vehicle:vehicles(license_plate)').order('created_at', { ascending: false }).limit(3),
      // Letzte 3 Kosten-Aktivitäten
      db.from('costs').select('id, amount, created_at, vehicle:vehicles(license_plate)').order('created_at', { ascending: false }).limit(3),
    ]);

    // Fehlerprüfung für alle Abfragen
    if (vehicleCountResult.error) throw vehicleCountResult.error;
    if (openDamagesResult.error) throw openDamagesResult.error;
    if (driverCountResult.error) throw driverCountResult.error;
    if (costsResult.error) throw costsResult.error;
    if (warningAppointmentsResult.error) throw warningAppointmentsResult.error;
    if (vehicleActivitiesResult.error) throw vehicleActivitiesResult.error;
    if (damageActivitiesResult.error) throw damageActivitiesResult.error;
    if (costActivitiesResult.error) throw costActivitiesResult.error;

    // Kosten für den Monat summieren
    const costsThisMonth = (costsResult.data ?? []).reduce(
      (sum: number, row: { amount: number }) => sum + Number(row.amount),
      0
    );

    // Aktivitäten zusammenführen und sortieren
    const activities = [
      ...(vehicleActivitiesResult.data ?? []).map((v) => ({
        id: `vehicle-${v.id}`,
        type: 'vehicle',
        description: `Fahrzeug ${v.license_plate} hinzugefügt`,
        created_at: v.created_at,
      })),
      ...(damageActivitiesResult.data ?? []).map((d) => {
        const vehicle = d.vehicle as unknown as { license_plate: string } | null;
        const desc = d.description as string | null;
        return {
          id: `damage-${d.id}`,
          type: 'damage',
          description: `Schaden gemeldet: ${desc?.substring(0, 50) ?? ''}${(desc?.length ?? 0) > 50 ? '...' : ''} (${vehicle?.license_plate ?? 'Unbekannt'})`,
          created_at: d.created_at,
        };
      }),
      ...(costActivitiesResult.data ?? []).map((c) => {
        const vehicle = c.vehicle as unknown as { license_plate: string } | null;
        return {
          id: `cost-${c.id}`,
          type: 'cost',
          description: `Kosten: ${Number(c.amount).toFixed(2)} € (${vehicle?.license_plate ?? 'Unbekannt'})`,
          created_at: c.created_at,
        };
      }),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      stats: {
        vehicleCount: vehicleCountResult.count ?? 0,
        openDamages: openDamagesResult.count ?? 0,
        driverCount: driverCountResult.count ?? 0,
        costsThisMonth,
      },
      warningAppointments: warningAppointmentsResult.data ?? [],
      recentActivities: activities,
    });
  } catch {
    return NextResponse.json({ error: 'Dashboard-Daten konnten nicht geladen werden' }, { status: 500 });
  }
}
