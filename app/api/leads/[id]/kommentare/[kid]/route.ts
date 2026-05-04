import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { deleteKommentar } from '@/lib/database/leads';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ kid: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { kid } = await params;
  try {
    await deleteKommentar(kid);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
