import { NextRequest, NextResponse } from 'next/server';
import { fetchLicenseEmployee, updateLicenseEmployee, archiveLicenseEmployee } from '@/lib/database/license-control';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const row = await fetchLicenseEmployee(id);
    if (!row) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    // Tenant-Isolation: Mitarbeiter muss zur Firma des Benutzers gehören.
    if (scope.companyId && row.company_id !== scope.companyId) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Mitarbeiter konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;

  // Tenant-Check vor jeder Mutation.
  if (scope.companyId) {
    const existing = await fetchLicenseEmployee(id);
    if (!existing || existing.company_id !== scope.companyId) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 }); }
  const b = body as Record<string, unknown>;
  try {
    if (b.action === 'archive') {
      await archiveLicenseEmployee(id);
      return NextResponse.json({ success: true });
    }
    // Verhindere company_id-Spoofing in Updates.
    if (scope.companyId) delete b.company_id;
    const row = await updateLicenseEmployee(id, b as Parameters<typeof updateLicenseEmployee>[1]);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mitarbeiter konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
