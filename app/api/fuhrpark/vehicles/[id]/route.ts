import { NextRequest, NextResponse } from 'next/server';
import { fetchVehicle, updateVehicle, archiveVehicle, deleteVehicle } from '@/lib/database/vehicles';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const row = await fetchVehicle(id);
    if (!row) return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Fahrzeug konnte nicht geladen werden' }, { status: 500 });
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
      await archiveVehicle(id);
      return NextResponse.json({ success: true });
    }
    const row = await updateVehicle(id, b as Parameters<typeof updateVehicle>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fahrzeug konnte nicht aktualisiert werden' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    await deleteVehicle(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Fahrzeug konnte nicht gelöscht werden' }, { status: 500 });
  }
}
