import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

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
    const rows = await sql`
      SELECT d.*,
        json_build_object('id', dt.id, 'name', dt.name) AS document_type,
        CASE WHEN d.vehicle_id IS NOT NULL THEN
          json_build_object('id', v.id, 'license_plate', v.license_plate, 'brand', v.brand, 'model', v.model)
        END AS vehicle,
        CASE WHEN d.driver_id IS NOT NULL THEN
          json_build_object('id', dr.id, 'first_name', dr.first_name, 'last_name', dr.last_name)
        END AS driver,
        CASE WHEN d.license_check_employee_id IS NOT NULL THEN
          json_build_object('id', le.id, 'first_name', le.first_name, 'last_name', le.last_name)
        END AS license_check_employee
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      LEFT JOIN vehicles v ON v.id = d.vehicle_id
      LEFT JOIN drivers dr ON dr.id = d.driver_id
      LEFT JOIN license_check_employees le ON le.id = d.license_check_employee_id
      WHERE TRUE
        AND (${vehicleId}::uuid IS NULL OR d.vehicle_id = ${vehicleId}::uuid)
        AND (${damageId}::uuid IS NULL OR d.damage_id = ${damageId}::uuid)
        AND (${appointmentId}::uuid IS NULL OR d.appointment_id = ${appointmentId}::uuid)
        AND (${driverId}::uuid IS NULL OR d.driver_id = ${driverId}::uuid)
        AND (${licenseCheckEmployeeId}::uuid IS NULL OR d.license_check_employee_id = ${licenseCheckEmployeeId}::uuid)
        AND (${licenseCheckId}::uuid IS NULL OR d.license_check_id = ${licenseCheckId}::uuid)
        AND (${uvvCheckId}::uuid IS NULL OR d.uvv_check_id = ${uvvCheckId}::uuid)
        AND (${entityType} IS NULL OR d.entity_type = ${entityType})
        AND (${documentTypeId}::uuid IS NULL OR d.document_type_id = ${documentTypeId}::uuid)
        AND (${dateFrom} IS NULL OR d.uploaded_at >= ${dateFrom}::timestamptz)
        AND (${dateTo} IS NULL OR d.uploaded_at <= (${dateTo}::date + INTERVAL '1 day'))
      ORDER BY d.uploaded_at DESC
    `;
    return NextResponse.json(rows);
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
    const [row] = await sql`INSERT INTO documents ${sql(body)} RETURNING *`;
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Dokument konnte nicht erstellt werden' }, { status: 500 });
  }
}
