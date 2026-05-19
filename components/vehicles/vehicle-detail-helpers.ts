/**
 * Hilfsfunktionen für die Fahrzeug-Detailansicht
 */

export const fuelTypeLabels: Record<string, string> = {
  diesel: 'Diesel',
  benzin: 'Benzin',
  elektro: 'Elektro',
  hybrid_benzin: 'Hybrid (Benzin)',
  hybrid_diesel: 'Hybrid (Diesel)',
  gas: 'Gas',
};

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('de-DE').format(mileage) + ' km';
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export interface TuvStatus {
  status: 'ok' | 'warning' | 'overdue';
  label: string;
}

export function getTuvStatus(tuvDueDate: string | null | undefined): TuvStatus {
  if (!tuvDueDate) return { status: 'ok', label: 'Nicht erfasst' };

  const due = new Date(tuvDueDate);
  const now = new Date();
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { status: 'overdue', label: `${Math.abs(daysUntil)} Tage überfällig` };
  if (daysUntil <= 30) return { status: 'warning', label: `In ${daysUntil} Tagen fällig` };

  // Format Anzeige
  const formatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
  return { status: 'ok', label: formatter.format(due) };
}
