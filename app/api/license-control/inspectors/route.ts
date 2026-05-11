import { NextRequest, NextResponse } from 'next/server';
import { fetchLicenseInspectors, createLicenseInspector } from '@/lib/database/license-control';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const status = request.nextUrl.searchParams.get('status') as 'active' | 'archived' | null;
  try {
    const rows = await fetchLicenseInspectors(status ?? undefined);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Prüfer konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  try {
    const row = await createLicenseInspector(body as Parameters<typeof createLicenseInspector>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Prüfer konnte nicht angelegt werden' }, { status: 500 });
  }
}
