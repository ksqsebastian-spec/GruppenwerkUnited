import { NextRequest, NextResponse } from 'next/server';
import { fetchDriversWithUvvStatus } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import type { UvvDriverFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  // companyId aus der Session — Client-Parameter wird ignoriert.
  const filters: UvvDriverFilters = {
    companyId: scope.companyId ?? undefined,
    status: searchParams.get('status') as UvvDriverFilters['status'] ?? undefined,
    search: searchParams.get('search') ?? undefined,
    uvvStatus: searchParams.get('uvvStatus') as UvvDriverFilters['uvvStatus'] ?? undefined,
  };
  try {
    const rows = await fetchDriversWithUvvStatus(filters);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnten nicht geladen werden' }, { status: 500 });
  }
}
