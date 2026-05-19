import { NextRequest, NextResponse } from 'next/server';
import { fetchUvvChecks, createUvvCheck, createBatchUvvChecks, deleteUvvCheck } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import { assertDriverInScope, assertDriversInScope } from '@/lib/database/drivers';
import type { UvvCheckInsert } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const driverId = request.nextUrl.searchParams.get('driverId');
  if (!driverId) return NextResponse.json({ error: 'driverId erforderlich' }, { status: 400 });

  // Tenant-Isolation: Fahrer muss zur Firma des Benutzers gehören.
  if (scope.companyId) {
    const ok = await assertDriverInScope(driverId, scope.companyId);
    if (!ok) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
  }

  try {
    const rows = await fetchUvvChecks(driverId);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'UVV-Unterweisungen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (Array.isArray(b.driverIds)) {
      const driverIds = b.driverIds as string[];
      if (scope.companyId) {
        const ok = await assertDriversInScope(driverIds, scope.companyId);
        if (!ok) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
      }
      const rows = await createBatchUvvChecks(driverIds, b.checkData as Omit<UvvCheckInsert, 'driver_id'>);
      return NextResponse.json(rows, { status: 201 });
    }
    const check = b as UvvCheckInsert;
    if (scope.companyId && check.driver_id) {
      const ok = await assertDriverInScope(check.driver_id, scope.companyId);
      if (!ok) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
    }
    const row = await createUvvCheck(check);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unterweisung konnte nicht erstellt werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: { id?: unknown };
  try { body = await request.json() as { id?: unknown }; } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'id erforderlich' }, { status: 400 });
  try {
    await deleteUvvCheck(body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unterweisung konnte nicht gelöscht werden' }, { status: 500 });
  }
}
