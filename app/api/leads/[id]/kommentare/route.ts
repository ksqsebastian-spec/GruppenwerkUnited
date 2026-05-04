import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchKommentare, createKommentar } from '@/lib/database/leads';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const data = await fetchKommentare(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Text fehlt' }, { status: 400 });
    const kommentar = await createKommentar(id, session.companyId, text.trim());
    return NextResponse.json(kommentar, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
