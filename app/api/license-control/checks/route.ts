import { NextRequest, NextResponse } from 'next/server';
import { fetchLicenseChecks, createLicenseCheck, createBatchLicenseChecks, deleteLicenseCheck } from '@/lib/database/license-control';
import type { LicenseCheckInsert } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const employeeId = request.nextUrl.searchParams.get('employeeId');
  if (!employeeId) return NextResponse.json({ error: 'employeeId erforderlich' }, { status: 400 });
  try {
    const rows = await fetchLicenseChecks(employeeId);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Kontrollen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (Array.isArray(b.employeeIds)) {
      const rows = await createBatchLicenseChecks(b.employeeIds as string[], b.checkData as Omit<LicenseCheckInsert, 'employee_id'>);
      return NextResponse.json(rows, { status: 201 });
    }
    const row = await createLicenseCheck(b as LicenseCheckInsert);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Kontrolle konnte nicht erstellt werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  let body: { id?: unknown };
  try { body = await request.json() as { id?: unknown }; } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'id erforderlich' }, { status: 400 });
  try {
    await deleteLicenseCheck(body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kontrolle konnte nicht gelöscht werden' }, { status: 500 });
  }
}
