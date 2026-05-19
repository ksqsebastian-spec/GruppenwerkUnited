import { NextRequest, NextResponse } from 'next/server';
import { fetchLicenseEmployees, createLicenseEmployee } from '@/lib/database/license-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import type { LicenseCheckEmployeeFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  // Tenant-Scoping: companyId IMMER aus Session, nie aus Client-Parametern.
  const filters: LicenseCheckEmployeeFilters = {
    companyId: scope.companyId ?? undefined,
    status: searchParams.get('status') as LicenseCheckEmployeeFilters['status'] ?? undefined,
    search: searchParams.get('search') ?? undefined,
    checkStatus: searchParams.get('checkStatus') as LicenseCheckEmployeeFilters['checkStatus'] ?? undefined,
  };
  try {
    const rows = await fetchLicenseEmployees(filters);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Mitarbeiter konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  try {
    // Mandanten können company_id nicht spoofen — wird serverseitig erzwungen.
    if (scope.companyId) body.company_id = scope.companyId;
    const row = await createLicenseEmployee(body as Parameters<typeof createLicenseEmployee>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mitarbeiter konnte nicht angelegt werden' }, { status: 500 });
  }
}
