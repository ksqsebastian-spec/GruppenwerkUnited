import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { updatePerson, deletePerson } from '@/lib/database/tickets';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const body = await req.json();
    const person = await updatePerson(id, body, session.isAdmin ? undefined : session.companyId);
    return NextResponse.json(person);
  } catch (error) {
    console.error('[/api/personen/[id] PATCH]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
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
    await deletePerson(id, session.isAdmin ? undefined : session.companyId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[/api/personen/[id] DELETE]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
