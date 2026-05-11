import sql from '@/lib/db';
import type { SessionData } from '@/lib/auth/session';

export interface ExportMeta {
  exportiert_am: string;
  firma_id: string;
  firma_name: string;
  version: string;
}

export interface FuhrparkExport {
  fahrzeuge: unknown[];
  fahrer: unknown[];
  fahrzeug_fahrer_zuordnungen: unknown[];
  termine: unknown[];
  schaeden: unknown[];
  kosten: unknown[];
  dokumente_metadaten: unknown[];
  fuehrerscheinkontrolle_mitarbeiter: unknown[];
  fuehrerscheinkontrolle_kontrollen: unknown[];
  uvv_unterweisungen: unknown[];
}

export interface RecruitingExport {
  stellen: unknown[];
  empfehlungen: unknown[];
}

export interface AffiliateExport {
  handwerker: unknown[];
  empfehlungen: unknown[];
}

export interface RoiExport {
  jobs: unknown[];
  konfiguration: unknown | null;
  ausgaben: unknown[];
}

export interface ExportPayload {
  meta: ExportMeta;
  fuhrpark?: FuhrparkExport;
  recruiting?: RecruitingExport;
  affiliate?: AffiliateExport;
  roi?: RoiExport;
  datenkodierung?: unknown[];
  automationen?: unknown[];
}

async function resolveFuhrparkCompanyId(companyName: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM companies WHERE name = ${companyName} LIMIT 1`;
  return (rows[0]?.id as string) ?? null;
}

async function exportFuhrpark(companyId: string): Promise<FuhrparkExport> {
  const [fahrzeuge, fahrer, schaeden, kosten, dokumente, lcMitarbeiter, lcKontrollen, uvvUnterweisungen] =
    await Promise.all([
      sql`SELECT * FROM vehicles WHERE company_id = ${companyId} ORDER BY license_plate`,
      sql`SELECT * FROM drivers WHERE company_id = ${companyId} ORDER BY last_name`,
      sql`SELECT d.*, dt.id as damage_type_id, dt.name as damage_type_name FROM damages d LEFT JOIN damage_types dt ON dt.id = d.damage_type_id WHERE d.company_id = ${companyId} ORDER BY d.date DESC`,
      sql`SELECT c.*, ct.id as cost_type_id, ct.name as cost_type_name FROM costs c LEFT JOIN cost_types ct ON ct.id = c.cost_type_id WHERE c.company_id = ${companyId} ORDER BY c.date DESC`,
      sql`SELECT d.id, d.name, d.entity_type, d.file_path, d.file_size, d.mime_type, d.notes, d.uploaded_at, dt.id as document_type_id, dt.name as document_type_name FROM documents d LEFT JOIN document_types dt ON dt.id = d.document_type_id WHERE d.company_id = ${companyId} ORDER BY d.uploaded_at DESC`,
      sql`SELECT * FROM license_check_employees WHERE company_id = ${companyId} ORDER BY last_name`,
      sql`SELECT lc.*, li.id as inspector_id, li.name as inspector_name FROM license_checks lc LEFT JOIN license_check_inspectors li ON li.id = lc.checked_by_id ORDER BY lc.check_date DESC`,
      sql`SELECT uc.*, ui.id as instructor_id, ui.name as instructor_name FROM uvv_checks uc LEFT JOIN uvv_instructors ui ON ui.id = uc.instructed_by_id ORDER BY uc.check_date DESC`,
    ]);

  const vehicleIds = fahrzeuge.map((v) => v.id as string);
  const employeeIds = lcMitarbeiter.map((e) => e.id as string);
  const driverIds = fahrer.map((d) => d.id as string);

  let zuordnungen: unknown[] = [];
  let termine: unknown[] = [];

  if (vehicleIds.length > 0) {
    [zuordnungen, termine] = await Promise.all([
      sql`SELECT vd.*, d.id as driver_id, d.first_name, d.last_name FROM vehicle_drivers vd LEFT JOIN drivers d ON d.id = vd.driver_id WHERE vd.vehicle_id = ANY(${vehicleIds})`,
      sql`SELECT a.*, at.id as type_id, at.name as type_name, at.color FROM appointments a LEFT JOIN appointment_types at ON at.id = a.appointment_type_id WHERE a.vehicle_id = ANY(${vehicleIds}) ORDER BY a.due_date`,
    ]);
  }

  const lcKontrollenGefiltert = (lcKontrollen as Record<string, unknown>[]).filter(
    (k) => k.employee_id && employeeIds.includes(k.employee_id as string)
  );

  const uvvGefiltert = (uvvUnterweisungen as Record<string, unknown>[]).filter(
    (u) => u.driver_id && driverIds.includes(u.driver_id as string)
  );

  return {
    fahrzeuge,
    fahrer,
    fahrzeug_fahrer_zuordnungen: zuordnungen,
    termine,
    schaeden,
    kosten,
    dokumente_metadaten: dokumente,
    fuehrerscheinkontrolle_mitarbeiter: lcMitarbeiter,
    fuehrerscheinkontrolle_kontrollen: lcKontrollenGefiltert,
    uvv_unterweisungen: uvvGefiltert,
  };
}

async function exportRecruiting(companyId: string): Promise<RecruitingExport> {
  const [stellen, empfehlungen] = await Promise.all([
    sql`SELECT * FROM stellen WHERE company = ${companyId} ORDER BY title`,
    sql`SELECT e.*, s.id as stelle_id_ref, s.title as stelle_title FROM empfehlungen e LEFT JOIN stellen s ON s.id = e.stelle_id WHERE e.stelle_id IS NOT NULL AND e.handwerker_id IS NULL AND e.company = ${companyId} ORDER BY e.created_at DESC`,
  ]);
  return { stellen, empfehlungen };
}

async function exportAffiliate(companyId: string): Promise<AffiliateExport> {
  const [handwerker, empfehlungen] = await Promise.all([
    sql`SELECT * FROM handwerker WHERE company = ${companyId} ORDER BY name`,
    sql`SELECT e.*, h.id as hw_id, h.name as hw_name, h.email as hw_email FROM empfehlungen e LEFT JOIN handwerker h ON h.id = e.handwerker_id WHERE e.handwerker_id IS NOT NULL AND e.stelle_id IS NULL AND e.company = ${companyId} ORDER BY e.created_at DESC`,
  ]);
  return { handwerker, empfehlungen };
}

async function exportRoi(companyId: string): Promise<RoiExport> {
  const [jobs, configRows, ausgaben] = await Promise.all([
    sql`SELECT * FROM roi.jobs WHERE company_id = ${companyId} ORDER BY datum DESC`,
    sql`SELECT * FROM roi.config WHERE company_id = ${companyId} LIMIT 1`,
    sql`SELECT * FROM roi.purchases WHERE company_id = ${companyId} ORDER BY purchased_at DESC`,
  ]);
  return { jobs, konfiguration: configRows[0] ?? null, ausgaben };
}

async function exportDatenkodierung(companyId: string): Promise<unknown[]> {
  return sql`SELECT * FROM datenkodierungen WHERE company = ${companyId} ORDER BY created_at DESC`;
}

async function exportAutomationen(companyId: string): Promise<unknown[]> {
  return sql`SELECT * FROM automation_nodes WHERE company = ${companyId} ORDER BY position ASC`;
}

export async function buildExportPayload(session: SessionData): Promise<ExportPayload> {
  const { companyId, companyName, isAdmin } = session;

  const allowedModules: string[] = isAdmin
    ? ['fuhrpark', 'recruiting', 'affiliate', 'roi', 'datenkodierung', 'automationen']
    : (await import('@/lib/auth/companies').then((m) => {
        const cfg = m.COMPANY_CONFIGS.find((c) => c.id === companyId);
        return cfg?.modules ?? [];
      }));

  const payload: ExportPayload = {
    meta: {
      exportiert_am: new Date().toISOString(),
      firma_id: companyId,
      firma_name: companyName,
      version: '1.0',
    },
  };

  const tasks: Promise<void>[] = [];

  if (allowedModules.includes('fuhrpark')) {
    tasks.push(
      resolveFuhrparkCompanyId(companyName).then(async (uuid) => {
        payload.fuhrpark = uuid
          ? await exportFuhrpark(uuid)
          : {
              fahrzeuge: [], fahrer: [], fahrzeug_fahrer_zuordnungen: [],
              termine: [], schaeden: [], kosten: [], dokumente_metadaten: [],
              fuehrerscheinkontrolle_mitarbeiter: [], fuehrerscheinkontrolle_kontrollen: [],
              uvv_unterweisungen: [],
            };
      })
    );
  }

  if (allowedModules.includes('recruiting')) {
    tasks.push(exportRecruiting(companyId).then((data) => { payload.recruiting = data; }));
  }

  if (allowedModules.includes('affiliate')) {
    tasks.push(exportAffiliate(companyId).then((data) => { payload.affiliate = data; }));
  }

  if (allowedModules.includes('roi')) {
    tasks.push(exportRoi(companyId).then((data) => { payload.roi = data; }));
  }

  if (allowedModules.includes('datenkodierung')) {
    tasks.push(exportDatenkodierung(companyId).then((data) => { payload.datenkodierung = data; }));
  }

  if (allowedModules.includes('automationen')) {
    tasks.push(exportAutomationen(companyId).then((data) => { payload.automationen = data; }));
  }

  await Promise.all(tasks);

  return payload;
}
