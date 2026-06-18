import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createTemplate, fetchTemplates } from '@/lib/database/markitdown';
import { templateSchema } from '@/lib/validations/markitdown';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const tagsParam = url.searchParams.get('tags');
  const search = url.searchParams.get('search') ?? undefined;
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;

  try {
    const rows = await fetchTemplates({ tags, search });
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

  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const nz = (v: string | null | undefined): string | null => (v && v.length > 0 ? v : null);

  try {
    const row = await createTemplate(session.companyId, {
      titel: parsed.data.titel,
      beschreibung: nz(parsed.data.beschreibung),
      tags: parsed.data.tags,
      markdown: parsed.data.markdown,
      source_dateiname: nz(parsed.data.source_dateiname),
      source_dateityp: nz(parsed.data.source_dateityp),
      saved_by: parsed.data.saved_by,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 });
  }
}
