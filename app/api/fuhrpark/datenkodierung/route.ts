import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDatenkodierungen,
  createDatenkodierung,
  updateDatenkodierungTags,
  deleteDatenkodierung,
} from '@/lib/database/datenkodierung';
import { requireSession } from '@/lib/auth/api';

/**
 * Datenkodierungen verwenden die session.companyId direkt (kein UUID-Lookup nötig,
 * da `company` als string-ID gespeichert wird, nicht als UUID-FK).
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? undefined;
  const tag = searchParams.get('tag') ?? undefined;

  try {
    const rows = await fetchDatenkodierungen(session.companyId, search, tag);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Kodierungen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  // companyId NUR aus Session — Client-Wert wird ignoriert
  delete body.companyId;
  try {
    const row = await createDatenkodierung(session.companyId, body as Parameters<typeof createDatenkodierung>[1]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kodierung konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { id?: unknown; tags?: unknown };
  try {
    body = await request.json() as { id?: unknown; tags?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.id !== 'string' || !Array.isArray(body.tags)) {
    return NextResponse.json({ error: 'id und tags erforderlich' }, { status: 400 });
  }
  try {
    const row = await updateDatenkodierungTags(session.companyId, body.id, body.tags as string[]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tags konnten nicht gespeichert werden' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { id?: unknown };
  try {
    body = await request.json() as { id?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.id !== 'string') {
    return NextResponse.json({ error: 'id erforderlich' }, { status: 400 });
  }
  try {
    await deleteDatenkodierung(session.companyId, body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kodierung konnte nicht gelöscht werden' }, { status: 500 });
  }
}
