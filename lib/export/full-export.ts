/**
 * Vollständige Daten-Export-Logik für alle Module.
 * Läuft ausschließlich serverseitig (admin client erforderlich).
 */

import { createAdminClient } from '@/lib/supabase/admin';
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

/**
 * Löst die Fuhrpark-UUID für eine Firma auf (Name → UUID).
 */
async function resolveFuhrparkCompanyId(
  supabase: ReturnType<typeof createAdminClient>,
  companyName: string
): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('name', companyName)
    .maybeSingle();
  return data?.id ?? null;
}

async function exportFuhrpark(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<FuhrparkExport> {
  const [
    { data: fahrzeuge },
    { data: fahrer },
    { data: schaeden },
    { data: kosten },
    { data: dokumente },
    { data: lcMitarbeiter },
    { data: lcKontrollen },
    { data: uvvUnterweisungen },
  ] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*')
      .eq('company_id', companyId)
      .order('license_plate'),
    supabase
      .from('drivers')
      .select('*')
      .eq('company_id', companyId)
      .order('last_name'),
    supabase
      .from('damages')
      .select('*, damage_type:damage_types(id, name)')
      .eq('company_id', companyId)
      .order('date', { ascending: false }),
    supabase
      .from('costs')
      .select('*, cost_type:cost_types(id, name)')
      .eq('company_id', companyId)
      .order('date', { ascending: false }),
    supabase
      .from('documents')
      .select('id, name, entity_type, file_path, file_size, mime_type, notes, uploaded_at, document_type:document_types(id, name)')
      .eq('company_id', companyId)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('license_check_employees')
      .select('*')
      .eq('company_id', companyId)
      .order('last_name'),
    supabase
      .from('license_checks')
      .select('*, checked_by:license_check_inspectors(id, name)')
      .order('check_date', { ascending: false }),
    supabase
      .from('uvv_checks')
      .select('*, instructed_by:uvv_instructors(id, name)')
      .order('check_date', { ascending: false }),
  ]);

  // Fahrzeug-Fahrer-Zuordnungen und Termine per Fahrzeuge-IDs laden
  const vehicleIds = (fahrzeuge ?? []).map((v: Record<string, unknown>) => v.id as string);
  const driverIds = (fahrer ?? []).map((d: Record<string, unknown>) => d.id as string);

  let zuordnungen: unknown[] = [];
  let termine: unknown[] = [];

  if (vehicleIds.length > 0) {
    const [{ data: z }, { data: t }] = await Promise.all([
      supabase
        .from('vehicle_drivers')
        .select('*, driver:drivers(id, first_name, last_name)')
        .in('vehicle_id', vehicleIds),
      supabase
        .from('appointments')
        .select('*, appointment_type:appointment_types(id, name, color)')
        .in('vehicle_id', vehicleIds)
        .order('due_date'),
    ]);
    zuordnungen = z ?? [];
    termine = t ?? [];
  }

  // LC-Kontrollen auf Fahrer dieser Firma filtern
  const lcKontrollenGefiltert = (lcKontrollen ?? []).filter((k: Record<string, unknown>) =>
    (k.driver_id && driverIds.includes(k.driver_id as string)) ||
    (k.employee_id && (lcMitarbeiter ?? []).some((e: Record<string, unknown>) => e.id === k.employee_id))
  );

  // UVV-Unterweisungen auf Fahrer dieser Firma filtern
  const uvvGefiltert = (uvvUnterweisungen ?? []).filter((u: Record<string, unknown>) =>
    u.driver_id && driverIds.includes(u.driver_id as string)
  );

  return {
    fahrzeuge: fahrzeuge ?? [],
    fahrer: fahrer ?? [],
    fahrzeug_fahrer_zuordnungen: zuordnungen,
    termine: termine,
    schaeden: schaeden ?? [],
    kosten: kosten ?? [],
    dokumente_metadaten: dokumente ?? [],
    fuehrerscheinkontrolle_mitarbeiter: lcMitarbeiter ?? [],
    fuehrerscheinkontrolle_kontrollen: lcKontrollenGefiltert,
    uvv_unterweisungen: uvvGefiltert,
  };
}

async function exportRecruiting(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<RecruitingExport> {
  const [{ data: stellen }, { data: empfehlungen }] = await Promise.all([
    supabase
      .from('stellen')
      .select('*')
      .eq('company', companyId)
      .order('title'),
    supabase
      .from('empfehlungen')
      .select('*, stelle:stelle_id(id, title)')
      .not('stelle_id', 'is', null)
      .is('handwerker_id', null)
      .eq('company', companyId)
      .order('created_at', { ascending: false }),
  ]);

  return {
    stellen: stellen ?? [],
    empfehlungen: empfehlungen ?? [],
  };
}

async function exportAffiliate(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<AffiliateExport> {
  const [{ data: handwerker }, { data: empfehlungen }] = await Promise.all([
    supabase
      .from('handwerker')
      .select('*')
      .eq('company', companyId)
      .order('name'),
    supabase
      .from('empfehlungen')
      .select('*, handwerker:handwerker_id(id, name, email)')
      .not('handwerker_id', 'is', null)
      .is('stelle_id', null)
      .eq('company', companyId)
      .order('created_at', { ascending: false }),
  ]);

  return {
    handwerker: handwerker ?? [],
    empfehlungen: empfehlungen ?? [],
  };
}

async function exportRoi(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<RoiExport> {
  const [{ data: jobs }, { data: configRows }, { data: ausgaben }] = await Promise.all([
    supabase
      .schema('roi')
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('datum', { ascending: false }),
    supabase
      .schema('roi')
      .from('config')
      .select('*')
      .eq('company_id', companyId)
      .limit(1),
    supabase
      .schema('roi')
      .from('purchases')
      .select('*')
      .eq('company_id', companyId)
      .order('purchased_at', { ascending: false }),
  ]);

  return {
    jobs: jobs ?? [],
    konfiguration: configRows?.[0] ?? null,
    ausgaben: ausgaben ?? [],
  };
}

async function exportDatenkodierung(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<unknown[]> {
  const { data } = await supabase
    .from('datenkodierungen')
    .select('*')
    .eq('company', companyId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

async function exportAutomationen(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<unknown[]> {
  const { data } = await supabase
    .from('automation_nodes')
    .select('*')
    .eq('company', companyId)
    .order('position', { ascending: true });

  return data ?? [];
}

/**
 * Erstellt den vollständigen Export-Payload für einen Account.
 * Exportiert nur Module auf die der Account Zugriff hat.
 */
export async function buildExportPayload(session: SessionData): Promise<ExportPayload> {
  const supabase = createAdminClient();
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
      resolveFuhrparkCompanyId(supabase, companyName).then(async (uuid) => {
        if (uuid) {
          payload.fuhrpark = await exportFuhrpark(supabase, uuid);
        } else {
          payload.fuhrpark = {
            fahrzeuge: [], fahrer: [], fahrzeug_fahrer_zuordnungen: [],
            termine: [], schaeden: [], kosten: [], dokumente_metadaten: [],
            fuehrerscheinkontrolle_mitarbeiter: [], fuehrerscheinkontrolle_kontrollen: [],
            uvv_unterweisungen: [],
          };
        }
      })
    );
  }

  if (allowedModules.includes('recruiting')) {
    tasks.push(
      exportRecruiting(supabase, companyId).then((data) => { payload.recruiting = data; })
    );
  }

  if (allowedModules.includes('affiliate')) {
    tasks.push(
      exportAffiliate(supabase, companyId).then((data) => { payload.affiliate = data; })
    );
  }

  if (allowedModules.includes('roi')) {
    tasks.push(
      exportRoi(supabase, companyId).then((data) => { payload.roi = data; })
    );
  }

  if (allowedModules.includes('datenkodierung')) {
    tasks.push(
      exportDatenkodierung(supabase, companyId).then((data) => { payload.datenkodierung = data; })
    );
  }

  if (allowedModules.includes('automationen')) {
    tasks.push(
      exportAutomationen(supabase, companyId).then((data) => { payload.automationen = data; })
    );
  }

  await Promise.all(tasks);

  return payload;
}
