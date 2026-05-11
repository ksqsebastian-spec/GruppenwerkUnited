import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchDateien, deleteDateiEintrag } from '@/lib/database/leads';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id, did } = await params;
  try {
    const dateien = await fetchDateien(id);
    const datei = dateien.find((d) => d.id === did);
    if (!datei) return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });

    await deleteDateiEintrag(did);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id, did } = await params;
  try {
    const dateien = await fetchDateien(id);
    const datei = dateien.find((d) => d.id === did);
    if (!datei) return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });

    // Datei-Downloads sind auf Sevalla noch nicht verfügbar
    return NextResponse.json({ error: 'Datei-Downloads sind auf Sevalla noch nicht verfügbar' }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
