import { COMPANY_CONFIGS } from '@/lib/auth/companies';
import type { TicketUrgency, TicketStatus } from '@/types';

interface BadgeConfig {
  label: string;
  /** Tailwind-Klassen für das Badge */
  className: string;
}

export const URGENCY_CONFIG: Record<TicketUrgency, BadgeConfig> = {
  niedrig: { label: 'Niedrig', className: 'bg-[#f0f9f1] text-[#16a34a] border-[#bbf7d0]' },
  mittel: { label: 'Mittel', className: 'bg-[#fef9ec] text-[#b45309] border-[#fde68a]' },
  hoch: { label: 'Hoch', className: 'bg-[#fef2f0] text-[#c0392b] border-[#e8b4ae]' },
};

export const STATUS_CONFIG: Record<TicketStatus, BadgeConfig> = {
  offen: { label: 'Offen', className: 'bg-[#f5f5f5] text-[#525252] border-[#e5e5e5]' },
  in_arbeit: { label: 'In Arbeit', className: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]' },
  erledigt: { label: 'Erledigt', className: 'bg-[#f0f9f1] text-[#16a34a] border-[#bbf7d0]' },
};

/** Reihenfolge für Sortierung: hoch zuerst */
export const URGENCY_ORDER: Record<TicketUrgency, number> = {
  hoch: 0,
  mittel: 1,
  niedrig: 2,
};

/** Auswählbare Firmen für Zuweisung / Datenablage (ohne Admin) */
export const FIRMEN = COMPANY_CONFIGS.filter((c) => !c.isAdmin).map((c) => ({
  id: c.id,
  name: c.name,
}));

/** Firmen-ID → Anzeigename */
export function firmaName(id: string | null): string {
  if (!id) return '—';
  return COMPANY_CONFIGS.find((c) => c.id === id)?.name ?? id;
}
