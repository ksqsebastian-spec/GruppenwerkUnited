import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const in30Days = new Date(now);
    in30Days.setDate(now.getDate() + 30);

    const [statsRows, warningRows, vehicleActivities, damageActivities, costActivities] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*) FROM vehicles WHERE status = 'active') AS vehicle_count,
          (SELECT COUNT(*) FROM damages WHERE status IN ('reported', 'in_repair')) AS open_damages,
          (SELECT COUNT(*) FROM drivers WHERE status = 'active') AS driver_count,
          (SELECT COALESCE(SUM(amount), 0) FROM costs WHERE date >= ${firstOfMonth}::date) AS costs_this_month
      `,
      sql`
        SELECT a.*,
          json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle
        FROM appointments a
        JOIN vehicles v ON v.id = a.vehicle_id
        WHERE a.status != 'completed'
          AND a.due_date <= ${in30Days.toISOString()}
        ORDER BY a.due_date ASC
      `,
      sql`SELECT id, license_plate, created_at FROM vehicles ORDER BY created_at DESC LIMIT 3`,
      sql`
        SELECT d.id, d.description, d.created_at,
          json_build_object('license_plate', v.license_plate) AS vehicle
        FROM damages d
        JOIN vehicles v ON v.id = d.vehicle_id
        ORDER BY d.created_at DESC LIMIT 3
      `,
      sql`
        SELECT c.id, c.amount, c.created_at,
          json_build_object('license_plate', v.license_plate) AS vehicle
        FROM costs c
        JOIN vehicles v ON v.id = c.vehicle_id
        ORDER BY c.created_at DESC LIMIT 3
      `,
    ]);

    const stats = statsRows[0] as {
      vehicle_count: string;
      open_damages: string;
      driver_count: string;
      costs_this_month: string;
    };

    const activities = [
      ...vehicleActivities.map((v) => {
        const row = v as { id: string; license_plate: string; created_at: string };
        return { id: `vehicle-${row.id}`, type: 'vehicle', description: `Fahrzeug ${row.license_plate} hinzugefügt`, created_at: row.created_at };
      }),
      ...damageActivities.map((d) => {
        const row = d as { id: string; description: string; created_at: string; vehicle: { license_plate: string } };
        return { id: `damage-${row.id}`, type: 'damage', description: `Schaden gemeldet: ${row.description?.substring(0, 50) ?? ''}${(row.description?.length ?? 0) > 50 ? '...' : ''} (${row.vehicle?.license_plate ?? 'Unbekannt'})`, created_at: row.created_at };
      }),
      ...costActivities.map((c) => {
        const row = c as { id: string; amount: number; created_at: string; vehicle: { license_plate: string } };
        return { id: `cost-${row.id}`, type: 'cost', description: `Kosten: ${Number(row.amount).toFixed(2)} € (${row.vehicle?.license_plate ?? 'Unbekannt'})`, created_at: row.created_at };
      }),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      stats: {
        vehicleCount: Number(stats.vehicle_count),
        openDamages: Number(stats.open_damages),
        driverCount: Number(stats.driver_count),
        costsThisMonth: Number(stats.costs_this_month),
      },
      warningAppointments: warningRows,
      recentActivities: activities,
    });
  } catch {
    return NextResponse.json({ error: 'Dashboard-Daten konnten nicht geladen werden' }, { status: 500 });
  }
}
