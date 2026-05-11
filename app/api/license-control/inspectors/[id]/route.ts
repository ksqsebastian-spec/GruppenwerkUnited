import { NextRequest, NextResponse } from 'next/server';
import { updateLicenseInspector, archiveLicenseInspector } from '@/lib/database/license-control';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (b.action === 'archive') {
      await archiveLicenseInspector(id);
      return NextResponse.json({ success: true });
    }
    const row = await updateLicenseInspector(id, b as Parameters<typeof updateLicenseInspector>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Prüfer konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
