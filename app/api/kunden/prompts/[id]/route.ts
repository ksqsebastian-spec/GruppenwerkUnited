import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchPrompt, updatePrompt, deletePrompt } from '@/lib/database/customers';
import { customerPromptUpdateSchema } from '@/lib/validations/customer';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    const row = await fetchPrompt(id, session.companyId);
    if (!row) return NextResponse.json({ error: 'Vorlage nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

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

  const parsed = customerPromptUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const nz = (v: string | null | undefined): string | null => (v && v.length > 0 ? v : null);
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.template !== undefined) updates.template = parsed.data.template;
  if (parsed.data.beschreibung !== undefined) updates.beschreibung = nz(parsed.data.beschreibung);
  if (parsed.data.kategorie !== undefined) updates.kategorie = nz(parsed.data.kategorie);

  try {
    const row = await updatePrompt(id, session.companyId, updates);
    return NextResponse.json(row);
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
    await deletePrompt(id, session.companyId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
