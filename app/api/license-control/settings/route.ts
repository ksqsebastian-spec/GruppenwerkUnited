import { NextRequest, NextResponse } from 'next/server';
import { fetchLicenseSettings, updateLicenseSettings } from '@/lib/database/license-control';

export async function GET(): Promise<NextResponse> {
  try {
    const row = await fetchLicenseSettings();
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Einstellungen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const row = await updateLicenseSettings(body as Parameters<typeof updateLicenseSettings>[0]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Einstellungen konnten nicht gespeichert werden' }, { status: 500 });
  }
}
