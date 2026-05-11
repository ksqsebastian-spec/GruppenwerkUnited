import { NextRequest, NextResponse } from 'next/server';
import { fetchUvvChecks, createUvvCheck, createBatchUvvChecks, deleteUvvCheck } from '@/lib/database/uvv-control';
import type { UvvCheckInsert } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const driverId = request.nextUrl.searchParams.get('driverId');
  if (!driverId) return NextResponse.json({ error: 'driverId erforderlich' }, { status: 400 });
  try {
    const rows = await fetchUvvChecks(driverId);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'UVV-Unterweisungen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (Array.isArray(b.driverIds)) {
      const rows = await createBatchUvvChecks(b.driverIds as string[], b.checkData as Omit<UvvCheckInsert, 'driver_id'>);
      return NextResponse.json(rows, { status: 201 });
    }
    const row = await createUvvCheck(b as UvvCheckInsert);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unterweisung konnte nicht erstellt werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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
