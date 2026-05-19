/**
 * Barrel-Export für die Führerscheinkontrolle.
 *
 * Die Implementierung wurde aufgeteilt in:
 * - license-control-helpers.ts   — reine Status-/Datums-Funktionen
 * - license-control-settings.ts  — Settings + Prüfer
 * - license-control-employees.ts — Mitarbeiter-CRUD + Status-Berechnung
 * - license-control-checks.ts    — Kontrollen, Fahrer-mit-Status, Statistiken
 *
 * Bestehende Importe `from '@/lib/database/license-control'` funktionieren weiter.
 */

export { calculateCheckStatus, calculateNextCheckDue } from './license-control-helpers';
export {
  fetchLicenseSettings,
  updateLicenseSettings,
  fetchLicenseInspectors,
  createLicenseInspector,
  updateLicenseInspector,
  archiveLicenseInspector,
} from './license-control-settings';
export {
  fetchLicenseEmployees,
  fetchLicenseEmployee,
  createLicenseEmployee,
  updateLicenseEmployee,
  archiveLicenseEmployee,
} from './license-control-employees';
export {
  fetchDriversWithLicenseStatus,
  updateDriverInspectorFlag,
  fetchLicenseChecksByDriver,
  fetchLicenseChecks,
  createLicenseCheck,
  createBatchLicenseChecks,
  deleteLicenseCheck,
  fetchLicenseControlStats,
  fetchLicenseWarningCount,
} from './license-control-checks';
