import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { deleteKommentar } from '@/lib/database/customers';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; kid: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { kid } = await params;
  try {
    await deleteKommentar(kid, session.companyId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
