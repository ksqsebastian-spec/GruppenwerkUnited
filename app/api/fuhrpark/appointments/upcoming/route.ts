import { NextResponse } from 'next/server';
import { fetchUpcomingAppointments } from '@/lib/database/appointments';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  try {
    const data = await fetchUpcomingAppointments(scope.companyId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Termine konnten nicht geladen werden' }, { status: 500 });
  }
}
