import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('documents')
      .select('id, name, file_path, file_size, mime_type, notes, entity_type, uploaded_at, vehicle_id, damage_id, appointment_id, driver_id, license_check_employee_id, license_check_id, uvv_check_id, document_type_id, document_type:document_types(id, name), vehicle:vehicles(company_id), driver:drivers(company_id)')
      .eq('id', id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }
    // Tenant-Ownership: über verknüpftes Fahrzeug oder Fahrer prüfen
    if (scope.companyId) {
      const v = (data as { vehicle?: { company_id?: string } | null }).vehicle;
      const dr = (data as { driver?: { company_id?: string } | null }).driver;
      const ownerCompany = v?.company_id ?? dr?.company_id;
      if (ownerCompany && ownerCompany !== scope.companyId) {
        return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
      }
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Dokument konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await params;
  try {
    const db = createAdminClient();

    if (scope.companyId) {
      const { data: doc } = await db
        .from('documents')
        .select('id, vehicle:vehicles(company_id), driver:drivers(company_id)')
        .eq('id', id)
        .maybeSingle();
      const v = (doc as { vehicle?: { company_id?: string } | null } | null)?.vehicle;
      const dr = (doc as { driver?: { company_id?: string } | null } | null)?.driver;
      const ownerCompany = v?.company_id ?? dr?.company_id;
      if (!doc || (ownerCompany && ownerCompany !== scope.companyId)) {
        return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
      }
    }

    const { error } = await db.from('documents').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Dokument konnte nicht gelöscht werden' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Dokument konnte nicht gelöscht werden' }, { status: 500 });
  }
}
