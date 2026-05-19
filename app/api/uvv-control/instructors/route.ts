import { NextRequest, NextResponse } from 'next/server';
import { fetchUvvInstructors, createUvvInstructor } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const status = request.nextUrl.searchParams.get('status') as 'active' | 'archived' | null;
  try {
    const rows = await fetchUvvInstructors(status ?? undefined);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Ausbilder konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  try {
    const row = await createUvvInstructor(body as Parameters<typeof createUvvInstructor>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Ausbilder konnte nicht angelegt werden' }, { status: 500 });
  }
}
