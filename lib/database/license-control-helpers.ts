/**
 * Status- und Datums-Hilfsfunktionen für die Führerscheinkontrolle.
 * Reine Funktionen, keine DB-Zugriffe.
 */

import { addMonths, differenceInDays, format } from 'date-fns';
import type { LicenseCheckStatus } from '@/types';

/**
 * Berechnet den Kontrollstatus eines Mitarbeiters basierend auf nextCheckDue.
 *
 * Buckets:
 * - overdue:   Fälligkeit in Vergangenheit (oder kein Datum)
 * - due_soon:  Fälligkeit innerhalb warningDays
 * - ok:        Fälligkeit weiter in der Zukunft
 */
export function calculateCheckStatus(
  nextCheckDue: string | null,
  warningDays: number
): LicenseCheckStatus {
  if (!nextCheckDue) return 'overdue';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextCheckDue);
  dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(dueDate, today);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warningDays) return 'due_soon';
  return 'ok';
}

/**
 * Berechnet das nächste Kontrolldatum basierend auf dem Intervall.
 */
export function calculateNextCheckDue(checkDate: string, intervalMonths: number): string {
  const date = new Date(checkDate);
  const nextDate = addMonths(date, intervalMonths);
  return format(nextDate, 'yyyy-MM-dd');
}
