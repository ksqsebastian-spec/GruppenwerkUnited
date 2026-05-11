import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDatenkodierungen,
  createDatenkodierung,
  updateDatenkodierungTags,
  deleteDatenkodierung,
} from '@/lib/database/datenkodierung';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const search = searchParams.get('search') ?? undefined;
  const tag = searchParams.get('tag') ?? undefined;

  if (!companyId) {
    return NextResponse.json({ error: 'companyId erforderlich' }, { status: 400 });
  }

  try {
    const rows = await fetchDatenkodierungen(companyId, search, tag);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Datenkodierungen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { companyId?: unknown; [key: string]: unknown };
  try {
    body = await request.json() as { companyId?: unknown; [key: string]: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.companyId !== 'string') {
    return NextResponse.json({ error: 'companyId erforderlich' }, { status: 400 });
  }
  const { companyId, ...input } = body;
  try {
    const row = await createDatenkodierung(companyId as string, input as Parameters<typeof createDatenkodierung>[1]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Kodierung konnte nicht erstellt werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: { companyId?: unknown; id?: unknown; tags?: unknown };
  try {
    body = await request.json() as { companyId?: unknown; id?: unknown; tags?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.companyId !== 'string' || typeof body.id !== 'string' || !Array.isArray(body.tags)) {
    return NextResponse.json({ error: 'companyId, id und tags erforderlich' }, { status: 400 });
  }
  try {
    const row = await updateDatenkodierungTags(body.companyId, body.id, body.tags as string[]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Tags konnten nicht gespeichert werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  let body: { companyId?: unknown; id?: unknown };
  try {
    body = await request.json() as { companyId?: unknown; id?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.companyId !== 'string' || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'companyId und id erforderlich' }, { status: 400 });
  }
  try {
    await deleteDatenkodierung(body.companyId, body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kodierung konnte nicht gelöscht werden' }, { status: 500 });
  }
}
