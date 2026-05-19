import { NextResponse } from 'next/server';
import { countOpenDamages } from '@/lib/database/damages';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  try {
    const count = await countOpenDamages(scope.companyId);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'Schadensanzahl konnte nicht geladen werden' }, { status: 500 });
  }
}
