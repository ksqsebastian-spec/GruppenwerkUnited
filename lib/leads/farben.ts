import type { LeadStatus, LeadPrioritaet } from '@/types';

export const STATUS_CONFIG: Record<LeadStatus, { label: string; farbe: string; hintergrund: string }> = {
  neu:               { label: 'Neu',               farbe: '#737373', hintergrund: '#f5f5f5' },
  kontaktiert:       { label: 'Kontaktiert',       farbe: '#2563eb', hintergrund: '#eff6ff' },
  qualifiziert:      { label: 'Qualifiziert',      farbe: '#7C3AED', hintergrund: '#f5f3ff' },
  angebot_versendet: { label: 'Angebot versendet', farbe: '#d97706', hintergrund: '#fffbeb' },
  in_verhandlung:    { label: 'In Verhandlung',    farbe: '#ea580c', hintergrund: '#fff7ed' },
  gewonnen:          { label: 'Gewonnen',          farbe: '#16a34a', hintergrund: '#f0fdf4' },
  verloren:          { label: 'Verloren',          farbe: '#dc2626', hintergrund: '#fef2f2' },
  pausiert:          { label: 'Pausiert',          farbe: '#64748b', hintergrund: '#f8fafc' },
};

export const PRIORITAET_CONFIG: Record<LeadPrioritaet, { label: string; farbe: string }> = {
  hoch:    { label: 'Hoch',    farbe: '#dc2626' },
  mittel:  { label: 'Mittel',  farbe: '#d97706' },
  niedrig: { label: 'Niedrig', farbe: '#16a34a' },
};

const TAG_FARBEN = [
  '#2563eb', '#7C3AED', '#16a34a', '#d97706', '#ea580c', '#dc2626', '#0891b2', '#0f766e',
];

export function tagFarbe(tag: string): string {
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return TAG_FARBEN[hash % TAG_FARBEN.length];
}

export function formatDatum(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
