import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAppointments,
  createAppointment,
} from '@/lib/database/appointments';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import type { AppointmentFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const dueBefore = searchParams.get('dueBefore');
  const dueAfter = searchParams.get('dueAfter');

  try {
    const rows = await fetchAppointments({
      vehicleId,
      status: status as AppointmentFilters['status'],
      dueBefore: dueBefore ? new Date(dueBefore) : undefined,
      dueAfter: dueAfter ? new Date(dueAfter) : undefined,
      tenantCompanyId: scope.companyId,
    });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Termine konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  try {
    const row = await createAppointment(body as Parameters<typeof createAppointment>[0], scope.companyId);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Termin konnte nicht angelegt werden' },
      { status: 500 }
    );
  }
}
