import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const overdue = await sql`
      UPDATE appointments
      SET status = 'overdue'
      WHERE status = 'pending' AND due_date < ${todayIso}
      RETURNING id, due_date, vehicle_id
    `;

    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    const upcoming = await sql`
      SELECT a.*, json_build_object('license_plate', v.license_plate, 'brand', v.brand, 'model', v.model) AS vehicle
      FROM appointments a
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.status = 'pending'
        AND a.due_date >= ${todayIso}
        AND a.due_date <= ${fourteenDaysFromNow.toISOString()}
    `;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      overdueAppointments: overdue.map((a) => {
        const r = a as { id: string; due_date: string; vehicle_id: string };
        return { id: r.id, due_date: r.due_date, vehicle_id: r.vehicle_id };
      }),
    });
  } catch (error) {
    console.error('Cron-Job Fehler:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
