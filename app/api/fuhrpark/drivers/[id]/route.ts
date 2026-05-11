import { NextRequest, NextResponse } from 'next/server';
import { fetchDriver, updateDriver, archiveDriver } from '@/lib/database/drivers';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const row = await fetchDriver(id);
    if (!row) return NextResponse.json({ error: 'Fahrer nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Fahrer konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  try {
    if (b.action === 'archive') {
      await archiveDriver(id);
      return NextResponse.json({ success: true });
    }
    const row = await updateDriver(id, b as Parameters<typeof updateDriver>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fahrer konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
