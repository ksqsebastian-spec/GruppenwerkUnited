import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireFuhrparkScope } from '@/lib/auth/fuhrpark-scope';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');
  const damageId = searchParams.get('damageId');
  const appointmentId = searchParams.get('appointmentId');
  const driverId = searchParams.get('driverId');
  const licenseCheckEmployeeId = searchParams.get('licenseCheckEmployeeId');
  const licenseCheckId = searchParams.get('licenseCheckId');
  const uvvCheckId = searchParams.get('uvvCheckId');
  const entityType = searchParams.get('entityType');
  const documentTypeId = searchParams.get('documentTypeId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  try {
    const db = createAdminClient();
    let query = db
      .from('documents')
      .select(
        `id, name, file_path, file_size, mime_type, notes, entity_type, uploaded_at,
         vehicle_id, damage_id, appointment_id, driver_id,
         license_check_employee_id, license_check_id, uvv_check_id, document_type_id,
         document_type:document_types(id, name),
         vehicle:vehicles(id, license_plate, brand, model, company_id),
         driver:drivers(id, first_name, last_name, company_id),
         license_check_employee:license_check_employees(id, first_name, last_name)`
      )
      .order('uploaded_at', { ascending: false });

    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    if (damageId) query = query.eq('damage_id', damageId);
    if (appointmentId) query = query.eq('appointment_id', appointmentId);
    if (driverId) query = query.eq('driver_id', driverId);
    if (licenseCheckEmployeeId) query = query.eq('license_check_employee_id', licenseCheckEmployeeId);
    if (licenseCheckId) query = query.eq('license_check_id', licenseCheckId);
    if (uvvCheckId) query = query.eq('uvv_check_id', uvvCheckId);
    if (entityType) query = query.eq('entity_type', entityType);
    if (documentTypeId) query = query.eq('document_type_id', documentTypeId);
    if (dateFrom) query = query.gte('uploaded_at', dateFrom);
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('uploaded_at', toDate.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Dokumente konnten nicht geladen werden' }, { status: 500 });
    }

    // Tenant-Filter clientseitig (documents hat kein direktes company_id-Feld):
    // ein Dokument gehört dem Tenant, wenn sein verknüpfter Owner (vehicle/driver) zur Firma gehört.
    const filtered = scope.companyId
      ? (data ?? []).filter((d: Record<string, unknown>) => {
          const v = d.vehicle as { company_id?: string } | null;
          const dr = d.driver as { company_id?: string } | null;
          if (v?.company_id) return v.company_id === scope.companyId;
          if (dr?.company_id) return dr.company_id === scope.companyId;
          // Termine/Schäden/Checks: über Owner-Tabelle scopen wäre teuer.
          // Mandanten sehen sie nur, wenn eine Owner-Beziehung mit company_id mitgeladen wurde.
          return false;
        })
      : (data ?? []);

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: 'Dokumente konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scope = await requireFuhrparkScope();
  if (scope instanceof NextResponse) return scope;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('documents')
      .insert(body)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: 'Dokument konnte nicht erstellt werden' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Dokument konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
