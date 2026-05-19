import { NextRequest, NextResponse } from 'next/server';
import { fetchUvvSettings, updateUvvSettings } from '@/lib/database/uvv-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';
import { requireAdminSession } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  try {
    const row = await fetchUvvSettings();
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Einstellungen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  // Globale Einstellungen — nur Admins dürfen ändern.
  const session = await requireAdminSession();
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  try {
    const row = await updateUvvSettings(body as Parameters<typeof updateUvvSettings>[0]);
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Einstellungen konnten nicht gespeichert werden' }, { status: 500 });
  }
}
