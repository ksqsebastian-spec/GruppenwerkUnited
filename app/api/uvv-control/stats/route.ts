import { NextResponse } from 'next/server';
import { fetchUvvControlStats, fetchUvvWarningCount } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  try {
    const companyId = scope.companyId ?? undefined;
    const [stats, warningCount] = await Promise.all([
      fetchUvvControlStats(companyId),
      fetchUvvWarningCount(companyId),
    ]);
    return NextResponse.json({ stats, warningCount });
  } catch {
    return NextResponse.json({ error: 'Statistiken konnten nicht geladen werden' }, { status: 500 });
  }
}
