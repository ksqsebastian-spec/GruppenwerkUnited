import { NextRequest, NextResponse } from 'next/server';
import { fetchDrivers, createDriver } from '@/lib/database/drivers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId') ?? undefined;
  const status = searchParams.get('status') as 'active' | 'archived' | undefined;

  try {
    const rows = await fetchDrivers({ companyId, status });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await createDriver(body as Parameters<typeof createDriver>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fahrer konnte nicht angelegt werden' }, { status: 500 });
  }
}
