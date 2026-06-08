/**
 * Firmen-Registry mit Farbkodierung für das Ticket-/Personen-System.
 *
 * Bewusst eigenständig (nicht aus COMPANY_CONFIGS abgeleitet), weil hier auch
 * Firmen vorkommen, die keinen eigenen Login haben (z.B. „Groundpassion").
 * Die IDs der Login-Firmen bleiben kompatibel zu COMPANY_CONFIGS.
 */

export interface FirmaConfig {
  id: string;
  name: string;
  /** Tailwind-Klassen für das Firmen-Badge. */
  className: string;
  /** Punktfarbe (HEX) für kompakte Markierungen. */
  dot: string;
}

export const FIRMEN_CONFIG: FirmaConfig[] = [
  { id: 'groundpassion', name: 'Groundpassion', className: 'bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]', dot: '#4338ca' },
  { id: 'brink',         name: 'Brink',          className: 'bg-[#ecfeff] text-[#0e7490] border-[#a5f3fc]', dot: '#0e7490' },
  { id: 'seehafer',      name: 'Seehafer',       className: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]', dot: '#1d4ed8' },
  { id: 'mehlig',        name: 'Mehlig',         className: 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]', dot: '#15803d' },
  { id: 'werner-bau',    name: 'Werner Bau',     className: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]', dot: '#c2410c' },
  { id: 'werner',        name: 'Werner Gerüst',  className: 'bg-[#fefce8] text-[#a16207] border-[#fef08a]', dot: '#a16207' },
  { id: 'hantke',        name: 'Hantke',         className: 'bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]', dot: '#be185d' },
  { id: 'gruppenwerk',   name: 'Gruppenwerk',    className: 'bg-[#faf5ff] text-[#7e22ce] border-[#e9d5ff]', dot: '#7e22ce' },
];

const FIRMA_FALLBACK: Omit<FirmaConfig, 'id' | 'name'> = {
  className: 'bg-[#f5f5f5] text-[#525252] border-[#e5e5e5]',
  dot: '#737373',
};

/** Dropdown-Optionen (id + name). */
export const FIRMEN_OPTIONS = FIRMEN_CONFIG.map((f) => ({ id: f.id, name: f.name }));

export function firmaConfig(id: string | null | undefined): FirmaConfig | null {
  if (!id) return null;
  return FIRMEN_CONFIG.find((f) => f.id === id) ?? null;
}

export function firmaName(id: string | null | undefined): string {
  if (!id) return '—';
  return firmaConfig(id)?.name ?? id;
}

export function firmaBadgeClass(id: string | null | undefined): string {
  return firmaConfig(id)?.className ?? FIRMA_FALLBACK.className;
}

export function firmaDot(id: string | null | undefined): string {
  return firmaConfig(id)?.dot ?? FIRMA_FALLBACK.dot;
}
