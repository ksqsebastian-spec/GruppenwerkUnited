import { NextRequest, NextResponse } from 'next/server';
import { fetchLicenseEmployees, createLicenseEmployee } from '@/lib/database/license-control';
import type { LicenseCheckEmployeeFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filters: LicenseCheckEmployeeFilters = {
    companyId: searchParams.get('companyId') ?? undefined,
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
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  try {
    const row = await createLicenseEmployee(body as Parameters<typeof createLicenseEmployee>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mitarbeiter konnte nicht angelegt werden' }, { status: 500 });
  }
}
