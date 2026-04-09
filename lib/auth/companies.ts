/**
 * Firmen-Konfiguration für das Multi-Tenant-Zugriffssystem.
 * Jede Firma hat ein eigenes Passwort (Env-Variable) und Zugriff auf bestimmte Module.
 */

export interface CompanyConfig {
  id: string;
  name: string;
  /** Modul-IDs oder ['*'] für vollen Zugriff */
  modules: string[];
  isAdmin: boolean;
  passwordEnvKey: string;
}

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
    name: 'Tischlerei Seehafer',
    modules: ['recruiting', 'affiliate', 'roi'],
    isAdmin: false,
    passwordEnvKey: 'SEEHAFER_PASSWORD',
  },
  {
    id: 'brink',
    name: 'Tischlerei Brink',
    modules: ['affiliate', 'recruiting', 'roi'],
    isAdmin: false,
    passwordEnvKey: 'BRINK_PASSWORD',
  },
  {
    id: 'hantke',
    name: 'Malerei Hantke',
    modules: ['recruiting', 'affiliate', 'roi'],
    isAdmin: false,
    passwordEnvKey: 'HANTKE_PASSWORD',
  },
  {
    id: 'gruppenwerk',
    name: 'Gruppenwerk',
    modules: ['fuhrpark'],
    isAdmin: false,
    passwordEnvKey: 'GRUPPENWERK_PASSWORD',
  },
];

/** URL-Präfix → Modul-ID */
export const ROUTE_TO_MODULE: Record<string, string> = {
  '/fuhrpark': 'fuhrpark',
  '/recruiting': 'recruiting',
  '/affiliate': 'affiliate',
  '/roi': 'roi',
  '/vob': 'vob',
};

/** Passwort prüfen und passende Firma zurückgeben */
export function matchCompanyByPassword(password: string): CompanyConfig | null {
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
