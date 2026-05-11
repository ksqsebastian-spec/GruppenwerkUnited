import { NextRequest, NextResponse } from 'next/server';
import { fetchDamage, updateDamage, deleteDamage } from '@/lib/database/damages';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const row = await fetchDamage(id);
    if (!row) return NextResponse.json({ error: 'Schaden nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Schaden konnte nicht geladen werden' }, { status: 500 });
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
  try {
    const row = await updateDamage(id, body as Parameters<typeof updateDamage>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Schaden konnte nicht aktualisiert werden' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    await deleteDamage(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Schaden konnte nicht gelöscht werden' }, { status: 500 });
  }
}
