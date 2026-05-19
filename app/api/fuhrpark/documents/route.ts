import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Abfrage mit verknüpften Tabellen
    let query = db
      .from('documents')
      .select(
        `*,
        document_type:document_types(id, name),
        vehicle:vehicles(id, license_plate, brand, model),
        driver:drivers(id, first_name, last_name),
        license_check_employee:license_check_employees(id, first_name, last_name)`
      )
      .order('uploaded_at', { ascending: false });

    // Filter anwenden
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
      // Bis Ende des angegebenen Tages filtern
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('uploaded_at', toDate.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Dokumente konnten nicht geladen werden' }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'Dokumente konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
      return NextResponse.json({ error: error.message ?? 'Dokument konnte nicht erstellt werden' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Dokument konnte nicht erstellt werden' }, { status: 500 });
  }
}
