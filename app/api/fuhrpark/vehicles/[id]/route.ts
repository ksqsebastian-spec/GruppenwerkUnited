import { NextRequest, NextResponse } from 'next/server';
import { fetchVehicle, updateVehicle, archiveVehicle, deleteVehicle, syncLeasingAppointment, syncLeasingCost } from '@/lib/database/vehicles';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const row = await fetchVehicle(id, scope.companyId);
    if (!row) return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Fahrzeug konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    if (body.action === 'archive') {
      await archiveVehicle(id, scope.companyId);
      return NextResponse.json({ success: true });
    }
    // company_id darf nicht via Update verändert werden (Tenant-Isolation)
    delete body.company_id;
    const row = await updateVehicle(id, body as Parameters<typeof updateVehicle>[1], scope.companyId);
    await Promise.all([
      syncLeasingAppointment(id, (body.leasing_end_date as string | null) ?? null, !!body.is_leased),
      syncLeasingCost(id, body.leasing_rate as number | null | undefined, !!body.is_leased),
    ]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fahrzeug konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    await deleteVehicle(id, scope.companyId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Fahrzeug konnte nicht gelöscht werden' }, { status: 500 });
  }
}
