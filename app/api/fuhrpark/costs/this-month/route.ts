import { NextResponse } from 'next/server';
import { fetchCostsThisMonth } from '@/lib/database/costs';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  try {
    const total = await fetchCostsThisMonth(scope.companyId);
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ error: 'Monatskosten konnten nicht geladen werden' }, { status: 500 });
  }
}
