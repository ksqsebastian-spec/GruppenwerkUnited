import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchPrompts, createPrompt } from '@/lib/database/customers';
import { customerPromptSchema } from '@/lib/validations/customer';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const rows = await fetchPrompts(session.companyId);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const parsed = customerPromptSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const nz = (v: string | null | undefined): string | null => (v && v.length > 0 ? v : null);
  const input = {
    name: parsed.data.name,
    beschreibung: nz(parsed.data.beschreibung),
    kategorie: nz(parsed.data.kategorie),
    template: parsed.data.template,
    datei_vorlage_id: parsed.data.datei_vorlage_id ?? null,
  };

  try {
    const row = await createPrompt(session.companyId, input);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 400 });
  }
}
