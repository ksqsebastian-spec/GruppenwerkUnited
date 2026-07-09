import { addMonths, format } from 'date-fns';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Kombiniert Tailwind CSS Klassen mit clsx und tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatiert ein Datum im deutschen Format (DD.MM.YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatiert einen Geldbetrag im deutschen Format (€1.234,56)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatiert ein Datum relativ zum heutigen Tag (z.B. "heute", "gestern",
 * "vor 3 Tagen") und fällt ab 7 Tagen auf das absolute Datum zurück.
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'heute';
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return formatDate(dateString);
}

/**
 * Bildet die Initialen eines Namens (max. 2 Zeichen, Großbuchstaben)
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Berechnet das nächste Kontrolldatum basierend auf dem Intervall (yyyy-MM-dd)
 */
export function calculateNextCheckDue(checkDate: string, intervalMonths: number): string {
  return format(addMonths(new Date(checkDate), intervalMonths), 'yyyy-MM-dd');
}

/**
 * Formatiert Kilometerstand (123.456 km)
 */
export function formatMileage(mileage: number): string {
  return `${new Intl.NumberFormat('de-DE').format(mileage)} km`;
}

/**
 * Berechnet die Tage bis zu einem Datum
 * Negative Werte = überfällig
 */
export function daysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gibt einen lesbaren Text für Tage bis Fälligkeit zurück
 */
export function getDueDateText(date: Date | string): string {
  const days = daysUntil(date);

  if (days < 0) {
    return `${Math.abs(days)} Tag${Math.abs(days) !== 1 ? 'e' : ''} überfällig`;
  }
  if (days === 0) {
    return 'Heute fällig';
  }
  if (days === 1) {
    return 'Morgen fällig';
  }
  return `in ${days} Tagen`;
}
