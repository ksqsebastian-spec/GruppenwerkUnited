import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron-Job für Terminbenachrichtigungen
 * Prüft überfällige und bald fällige Termine
 *
 * Aufruf: Täglich um 8:00 Uhr via Vercel Cron oder externem Scheduler
 * URL: /api/cron/appointments
 *
 * Benötigt CRON_SECRET zur Authentifizierung
 */
export async function GET(request: Request): Promise<NextResponse> {
  // Cron-Secret prüfen
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Nicht autorisiert' },
      { status: 401 }
    );
  }

  try {
    // Supabase Service-Client (Server-seitig mit Admin-Rechten)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase-Konfiguration fehlt');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Termine die überfällig sind (due_date < heute)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Überfällige Termine auf "overdue" setzen
    const { data: overdueAppointments, error: overdueError } = await supabase
      .from('appointments')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today.toISOString())
      .select();

    if (overdueError) {
      console.error('Fehler beim Aktualisieren überfälliger Termine:', overdueError);
    }

    // Termine in den nächsten 14 Tagen finden (für Benachrichtigungen)
    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from('appointments')
      .select(`
        *,
        vehicle:vehicles(license_plate, brand, model)
      `)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString())
      .lte('due_date', fourteenDaysFromNow.toISOString());

    if (upcomingError) {
      console.error('Fehler beim Laden bevorstehender Termine:', upcomingError);
    }

    // Hier könnte man E-Mail-Benachrichtigungen versenden
    // oder Webhook an externes System senden

    // Beispiel für Logging
    console.log(`Cron-Job ausgeführt: ${overdueAppointments?.length ?? 0} Termine auf überfällig gesetzt, ${upcomingAppointments?.length ?? 0} bevorstehende Termine`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overdueCount: overdueAppointments?.length ?? 0,
      upcomingCount: upcomingAppointments?.length ?? 0,
      overdueAppointments: overdueAppointments?.map((apt) => ({
        id: apt.id,
        due_date: apt.due_date,
        vehicle_id: apt.vehicle_id,
      })),
    });
  } catch (error) {
    console.error('Cron-Job Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: String(error) },
      { status: 500 }
    );
  }
}
