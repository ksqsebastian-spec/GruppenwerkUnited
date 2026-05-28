import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import {
  updateAutomatisierungsknoten,
  deleteAutomatisierungsknoten,
} from '@/lib/automationen/queries';
import { knotenUpdateSchema } from '@/lib/validations/automationen';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const parsed = knotenUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const knoten = await updateAutomatisierungsknoten(session.companyId, id, parsed.data);
    return NextResponse.json(knoten);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
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
    await deleteAutomatisierungsknoten(session.companyId, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
