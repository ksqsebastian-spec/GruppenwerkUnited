import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchMappings, createMapping } from '@/lib/database/customers';
import type { CustomerMappingEintrag } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    const rows = await fetchMappings(id, session.companyId);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  let body: { anlass?: unknown; eintraege?: unknown };
  try {
    body = (await req.json()) as { anlass?: unknown; eintraege?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.anlass !== 'string' || body.anlass.trim().length === 0) {
    return NextResponse.json({ error: 'Anlass erforderlich' }, { status: 400 });
  }
  if (!Array.isArray(body.eintraege) || body.eintraege.length === 0) {
    return NextResponse.json({ error: 'Keine Mapping-Einträge übermittelt' }, { status: 400 });
  }

  // Einträge minimal validieren/normalisieren
  const eintraege: CustomerMappingEintrag[] = [];
  for (const e of body.eintraege as Array<Record<string, unknown>>) {
    if (typeof e.code !== 'string' || typeof e.value !== 'string') {
      return NextResponse.json({ error: 'Ungültiger Mapping-Eintrag' }, { status: 400 });
    }
    eintraege.push({
      code: e.code,
      value: e.value,
      field: typeof e.field === 'string' ? e.field : '',
      label: typeof e.label === 'string' ? e.label : '',
    });
  }

  try {
    const row = await createMapping(id, session.companyId, body.anlass.trim(), eintraege);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 });
  }
}
