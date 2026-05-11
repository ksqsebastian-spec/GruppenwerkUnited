import { NextResponse } from 'next/server';
import { fetchUpcomingAppointments } from '@/lib/database/appointments';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await fetchUpcomingAppointments();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Termine konnten nicht geladen werden' }, { status: 500 });
  }
}
