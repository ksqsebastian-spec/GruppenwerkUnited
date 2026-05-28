import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import {
  fetchTicketDateien,
  deleteTicketDateiEintrag,
  removeTicketDateiAusStorage,
  getTicketDateiDownloadUrl,
} from '@/lib/database/tickets';

// Liefert eine signierte Download-URL für die Datei
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id, did } = await params;
  try {
    const dateien = await fetchTicketDateien(id);
    const datei = dateien.find((d) => d.id === did);
    if (!datei) return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    const url = await getTicketDateiDownloadUrl(datei.dateipfad);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { did } = await params;
  try {
    const entfernt = await deleteTicketDateiEintrag(did);
    if (entfernt) await removeTicketDateiAusStorage(entfernt.dateipfad);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
