import { NextRequest, NextResponse } from 'next/server';
import { fetchDriverWithUvvStatus } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const row = await fetchDriverWithUvvStatus(id);
    if (!row) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
    // Tenant-Isolation: Fahrer muss zur Firma des Benutzers gehören.
    if (scope.companyId && row.company_id !== scope.companyId) {
      return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnte nicht geladen werden' }, { status: 500 });
  }
}
