import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import {
  fetchAutomatisierungsknoten,
  createAutomatisierungsknoten,
} from '@/lib/automationen/queries';
import { knotenCreateSchema } from '@/lib/validations/automationen';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const knoten = await fetchAutomatisierungsknoten(session.companyId);
    return NextResponse.json(knoten);
  } catch (error) {
    console.error('[/api/automationen GET]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
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

  const parsed = knotenCreateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Optionale Felder auf null normalisieren (Zod liefert undefined, der Insert-Typ erwartet null)
  const { parent_id, description, prompt_template, gdrive_path, ...rest } = parsed.data;
  const input = {
    ...rest,
    parent_id: parent_id ?? null,
    description: description ?? null,
    prompt_template: prompt_template ?? null,
    gdrive_path: gdrive_path ?? null,
  };

  try {
    const knoten = await createAutomatisierungsknoten(session.companyId, input);
    return NextResponse.json(knoten, { status: 201 });
  } catch (error) {
    console.error('[/api/automationen POST]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
