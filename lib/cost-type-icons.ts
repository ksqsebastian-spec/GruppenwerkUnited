import {
  Car,
  ClipboardCheck,
  Construction,
  Droplets,
  FileText,
  Fuel,
  Receipt,
  Route,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Ordnet Kostenart-Icons (Emoji oder Name) Lucide-Komponenten zu */
const ICON_MAP: Record<string, LucideIcon> = {
  // Emoji-Werte aus der Datenbank
  '⛽': Fuel,
  '🔧': Wrench,
  '🛠️': Construction,
  '🛡️': ShieldCheck,
  '📋': ClipboardCheck,
  '📄': FileText,
  '🅿️': Car,
  '🛣️': Route,
  '🚿': Droplets,
  // Name-Werte aus DEFAULT_COST_TYPES
  fuel: Fuel,
  wrench: Wrench,
  tool: Construction,
  circle: Receipt,
  shield: ShieldCheck,
  receipt: Receipt,
  droplet: Droplets,
  parking: Car,
  'more-horizontal': Receipt,
};

export function getCostTypeIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Receipt;
  return ICON_MAP[icon] ?? Receipt;
}
