import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchDateien, deleteDateiEintrag, getDateiDownloadUrl } from '@/lib/database/leads';
import { deleteFile } from '@/lib/storage';

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

    const url = await getDateiDownloadUrl(datei.dateipfad);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

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

    await deleteFile(datei.dateipfad).catch(() => {});
    await deleteDateiEintrag(did);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
