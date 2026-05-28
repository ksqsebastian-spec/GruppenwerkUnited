import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { updateKnotenPosition } from '@/lib/automationen/queries';
import { knotenPositionSchema } from '@/lib/validations/automationen';

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

  const parsed = knotenPositionSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await updateKnotenPosition(session.companyId, id, parsed.data.position_x, parsed.data.position_y);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
