/**
 * Firmen-Konfiguration für das Multi-Tenant-Zugriffssystem.
 * Jede Firma hat ein eigenes Passwort (Env-Variable oder DB-Fallback) und Zugriff auf bestimmte Module.
 *
 * Passwort-Priorität:
 *   1. Umgebungsvariable (z.B. SEEHAFER_PASSWORD) — bevorzugt
 *   2. Datenbank-Eintrag in app_settings (key: "passwords") — Fallback wenn Env-Var fehlt
 */

export interface CompanyConfig {
  id: string;
  name: string;
  /** Modul-IDs oder ['*'] für vollen Zugriff */
  modules: string[];
  isAdmin: boolean;
  passwordEnvKey: string;
}

/**
 * Modul-Liste für reguläre Firmen. Admin behält '*' und sieht weiterhin alles —
 * inklusive Modulen, die hier ausgelassen werden (z.B. 'automationen', das vor
 * dem Go-Live für Endkunden ausgeblendet wurde).
 */
export const ALL_MODULES: string[] = [
  'roi',
  'recruiting',
  'affiliate',
  'datenkodierung',
  'vob',
  'leads',
  'fuhrpark',
  'consulting',
  'tickets',
  'kunden',
];

export const COMPANY_CONFIGS: CompanyConfig[] = [
  {
    id: 'admin',
    name: 'Admin',
    modules: ['*'],
    isAdmin: true,
    passwordEnvKey: 'ADMIN_PASSWORD',
  },
  {
    id: 'seehafer',
    name: 'Seehafer Elemente',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'SEEHAFER_PASSWORD',
  },
  {
    id: 'brink',
    name: 'Tischlerei Brink',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'BRINK_PASSWORD',
  },
  {
    id: 'hantke',
    name: 'Malerei Hantke',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'HANTKE_PASSWORD',
  },
  {
    id: 'gruppenwerk',
    name: 'Gruppenwerk',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'GRUPPENWERK_PASSWORD',
  },
  {
    id: 'werner',
    name: 'Werner Gerüstbau',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'WERNER_PASSWORD',
  },
  {
    id: 'werner-bau',
    name: 'Werner Bau',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'WERNER_BAU_PASSWORD',
  },
  {
    id: 'mehlig',
    name: 'Tischlerei Mehlig',
    modules: ALL_MODULES,
    isAdmin: false,
    passwordEnvKey: 'MEHLIG_PASSWORD',
  },
];

/** URL-Präfix → Modul-ID */
export const ROUTE_TO_MODULE: Record<string, string> = {
  '/fuhrpark': 'fuhrpark',
  '/recruiting': 'recruiting',
  '/affiliate': 'affiliate',
  '/roi': 'roi',
  '/vob': 'vob',
  '/datenkodierung': 'datenkodierung',
  '/leads': 'leads',
  '/automationen': 'automationen',
  '/consulting': 'consulting',
  '/tickets': 'tickets',
  '/kunden': 'kunden',
};

/**
 * Passwort gegen Umgebungsvariablen prüfen.
 * Gibt die passende Firma zurück oder null wenn kein Match.
 */
export function matchCompanyByPasswordEnv(password: string): CompanyConfig | null {
  for (const company of COMPANY_CONFIGS) {
    const envPassword = process.env[company.passwordEnvKey];
    if (envPassword && password === envPassword) {
      return company;
    }
  }
  // Fallback: APP_PASSWORD (altes Single-Password-System) → Admin-Zugang
  const appPassword = process.env.APP_PASSWORD;
  if (appPassword && password === appPassword) {
    return COMPANY_CONFIGS.find((c) => c.isAdmin) ?? null;
  }
  return null;
}

/**
 * Passwort gegen DB-Einträge in app_settings prüfen.
 * Wird als Fallback verwendet wenn Env-Variablen nicht gesetzt sind.
 * DB-Eintrag: { key: "passwords", value: { "SEEHAFER_PASSWORD": "...", ... } }
 */
export async function matchCompanyByPasswordDb(password: string): Promise<CompanyConfig | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const db = createAdminClient();
    const { data } = await db.from('app_settings').select('value').eq('key', 'passwords').single();
    if (!data) return null;

    const dbPasswords = (data as { value: Record<string, string> }).value;
    for (const company of COMPANY_CONFIGS) {
      const dbPassword = dbPasswords[company.passwordEnvKey];
      if (dbPassword && password === dbPassword) {
        return company;
      }
    }
    const appPassword = dbPasswords['APP_PASSWORD'];
    if (appPassword && password === appPassword) {
      return COMPANY_CONFIGS.find((c) => c.isAdmin) ?? null;
    }
  } catch {
    // DB nicht erreichbar — kein Fehler werfen, einfach null zurückgeben
  }
  return null;
}

/**
 * Passwort prüfen — erst Env-Variablen, dann DB als Fallback.
 * Gibt die passende Firma zurück oder null wenn kein Match.
 */
export async function matchCompanyByPassword(password: string): Promise<CompanyConfig | null> {
  // 1. Env-Variablen prüfen (schnell, kein Netzwerk)
  const envMatch = matchCompanyByPasswordEnv(password);
  if (envMatch) return envMatch;

  // 2. DB-Fallback (wenn Env-Variablen nicht gesetzt sind)
  return matchCompanyByPasswordDb(password);
}

/** Prüft ob eine Firma Zugriff auf ein Modul hat */
export function hasModuleAccess(company: CompanyConfig, moduleId: string): boolean {
  if (company.isAdmin || company.modules.includes('*')) return true;
  return company.modules.includes(moduleId);
}

/** Gibt die erlaubten Module einer Firma zurück (expandiert '*') */
export function getAllowedModules(company: CompanyConfig): string[] | '*' {
  if (company.isAdmin || company.modules.includes('*')) return '*';
  return company.modules;
}
