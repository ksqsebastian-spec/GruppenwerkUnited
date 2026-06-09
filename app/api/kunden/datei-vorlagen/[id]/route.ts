import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { deleteDateiVorlage, getDateiVorlageDownloadUrl } from '@/lib/database/customers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    const url = await getDateiVorlageDownloadUrl(id, session.companyId);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    await deleteDateiVorlage(id, session.companyId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
