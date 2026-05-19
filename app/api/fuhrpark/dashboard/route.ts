import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

/**
 * Dashboard-Daten für den Fuhrpark.
 * 8 parallele Queries, alle gefiltert auf die Tenant-Firma (sofern nicht Admin).
 */
export async function GET(): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  try {
    const db = createAdminClient();
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const in30Days = new Date(now);
    in30Days.setDate(now.getDate() + 30);

    // Builder-Helfer: pure column-Filter, wenn Tenant-Scope aktiv
    const scopeFilter = scope.companyId;

    const vehicleCountQ = db.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'active');
    if (scopeFilter) vehicleCountQ.eq('company_id', scopeFilter);

    // Schäden zählen — Filterung über vehicle.company_id via inner-Join
    const openDamagesQ = scopeFilter
      ? db.from('damages')
          .select('id, vehicle:vehicles!inner(company_id)', { count: 'exact', head: true })
          .in('status', ['reported', 'in_repair'])
          .eq('vehicle.company_id', scopeFilter)
      : db.from('damages').select('*', { count: 'exact', head: true }).in('status', ['reported', 'in_repair']);

    const driverCountQ = db.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active');
    if (scopeFilter) driverCountQ.eq('company_id', scopeFilter);

    const costsQ = scopeFilter
      ? db.from('costs')
          .select('amount, vehicle:vehicles!inner(company_id)')
          .gte('date', firstOfMonth)
          .eq('vehicle.company_id', scopeFilter)
      : db.from('costs').select('amount').gte('date', firstOfMonth);

    const warningAppointmentsQ = scopeFilter
      ? db.from('appointments')
          .select('id, due_date, status, notes, vehicle:vehicles!inner(id, license_plate, brand, model, company_id), appointment_type:appointment_types(id, name, color)')
          .neq('status', 'completed')
          .lte('due_date', in30Days.toISOString())
          .eq('vehicle.company_id', scopeFilter)
          .order('due_date', { ascending: true })
      : db.from('appointments')
          .select('id, due_date, status, notes, vehicle:vehicles(id, license_plate, brand, model), appointment_type:appointment_types(id, name, color)')
          .neq('status', 'completed')
          .lte('due_date', in30Days.toISOString())
          .order('due_date', { ascending: true });

    const vehicleActivitiesQ = db.from('vehicles')
      .select('id, license_plate, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    if (scopeFilter) vehicleActivitiesQ.eq('company_id', scopeFilter);

    const damageActivitiesQ = scopeFilter
      ? db.from('damages')
          .select('id, description, created_at, vehicle:vehicles!inner(license_plate, company_id)')
          .eq('vehicle.company_id', scopeFilter)
          .order('created_at', { ascending: false })
          .limit(3)
      : db.from('damages')
          .select('id, description, created_at, vehicle:vehicles(license_plate)')
          .order('created_at', { ascending: false })
          .limit(3);

    const costActivitiesQ = scopeFilter
      ? db.from('costs')
          .select('id, amount, created_at, vehicle:vehicles!inner(license_plate, company_id)')
          .eq('vehicle.company_id', scopeFilter)
          .order('created_at', { ascending: false })
          .limit(3)
      : db.from('costs')
          .select('id, amount, created_at, vehicle:vehicles(license_plate)')
          .order('created_at', { ascending: false })
          .limit(3);

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
      vehicleCountQ,
      openDamagesQ,
      driverCountQ,
      costsQ,
      warningAppointmentsQ,
      vehicleActivitiesQ,
      damageActivitiesQ,
      costActivitiesQ,
    ]);

    if (vehicleCountResult.error) throw vehicleCountResult.error;
    if (openDamagesResult.error) throw openDamagesResult.error;
    if (driverCountResult.error) throw driverCountResult.error;
    if (costsResult.error) throw costsResult.error;
    if (warningAppointmentsResult.error) throw warningAppointmentsResult.error;
    if (vehicleActivitiesResult.error) throw vehicleActivitiesResult.error;
    if (damageActivitiesResult.error) throw damageActivitiesResult.error;
    if (costActivitiesResult.error) throw costActivitiesResult.error;

    const costsThisMonth = (costsResult.data ?? []).reduce(
      (sum: number, row: { amount: number }) => sum + Number(row.amount),
      0
    );

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
        const truncated = desc?.substring(0, 50) ?? '';
        const ellipsis = (desc?.length ?? 0) > 50 ? '...' : '';
        return {
          id: `damage-${d.id}`,
          type: 'damage',
          description: `Schaden gemeldet: ${truncated}${ellipsis} (${vehicle?.license_plate ?? 'Unbekannt'})`,
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
