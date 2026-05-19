import { NextRequest, NextResponse } from 'next/server';
import { fetchCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/database/companies';
import { requireSession, requireAdminSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const rows = await fetchCompanies();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Unternehmen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await createCompany(body as Parameters<typeof createCompany>[0]);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unternehmen konnte nicht angelegt werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;
  let body: { id?: unknown; [key: string]: unknown };
  try {
    body = await request.json() as { id?: unknown; [key: string]: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (typeof body.id !== 'string') {
    return NextResponse.json({ error: 'id erforderlich' }, { status: 400 });
  }
  const { id, ...updates } = body;
  try {
    const row = await updateCompany(id as string, updates as Parameters<typeof updateCompany>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unternehmen konnte nicht aktualisiert werden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await requireAdminSession();
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
    await deleteCompany(body.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unternehmen konnte nicht gelöscht werden' }, { status: 500 });
  }
}
