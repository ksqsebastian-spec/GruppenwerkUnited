import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLicenseChecks,
  createLicenseCheck,
  createBatchLicenseChecks,
  deleteLicenseCheck,
  assertLicenseEmployeeInScope,
  assertLicenseEmployeesInScope,
} from '@/lib/database/license-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import type { LicenseCheckInsert } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const employeeId = request.nextUrl.searchParams.get('employeeId');
  if (!employeeId) return NextResponse.json({ error: 'employeeId erforderlich' }, { status: 400 });

  // Tenant-Isolation: Mitarbeiter muss zur Firma des Benutzers gehören.
  if (scope.companyId) {
    const ok = await assertLicenseEmployeeInScope(employeeId, scope.companyId);
    if (!ok) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
  }

  try {
    const rows = await fetchLicenseChecks(employeeId);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Kontrollen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (Array.isArray(b.employeeIds)) {
      const employeeIds = b.employeeIds as string[];
      if (scope.companyId) {
        const ok = await assertLicenseEmployeesInScope(employeeIds, scope.companyId);
        if (!ok) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
      }
      const rows = await createBatchLicenseChecks(employeeIds, b.checkData as Omit<LicenseCheckInsert, 'employee_id'>);
      return NextResponse.json(rows, { status: 201 });
    }
    const check = b as LicenseCheckInsert;
    if (scope.companyId && check.employee_id) {
      const ok = await assertLicenseEmployeeInScope(check.employee_id, scope.companyId);
      if (!ok) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }
    const row = await createLicenseCheck(check);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Kontrolle konnte nicht erstellt werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

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
