/**
 * Werkbank Modul-Registry
 *
 * Zentrale Konfiguration aller Module der Werkbank-Plattform.
 * Neue Module werden hier eingetragen und erscheinen automatisch
 * in der Sidebar und auf dem Dashboard.
 */

export interface ModuleConfig {
  /** Eindeutige ID des Moduls */
  id: string;
  /** Anzeigename */
  name: string;
  /** Kurzbeschreibung */
  description: string;
  /** Basis-Route (z.B. "/fuhrpark") */
  route: string;
  /** Lucide-Icon-Name */
  icon: string;
  /** Kategorie: allgemeines Tool oder firmengebunden */
  category: 'tool' | 'company';
  /** Firmen-Slug (nur bei category: 'company') */
  company?: string;
  /** Firmenanzeigename (nur bei category: 'company') */
  companyName?: string;
  /** Akzentfarbe der Firma (HEX) */
  companyColor?: string;
  /** Supabase-Schema für dieses Modul */
  schema?: string;
  /** Status des Moduls */
  status: 'active' | 'coming_soon' | 'disabled';
}

export const MODULES: ModuleConfig[] = [
  {
    id: 'vob',
    name: 'VOB Monitor',
    description: 'Öffentliche Ausschreibungen überwachen und analysieren',
    route: '/vob',
    icon: 'FileSearch',
    category: 'tool',
    schema: 'vob',
    status: 'active',
  },
  {
    id: 'roi',
    name: 'ROI Rechner',
    description: 'Dienstleistungs-ROI berechnen und auswerten',
    route: '/roi',
    icon: 'TrendingUp',
    category: 'tool',
    status: 'active',
  },
  {
    id: 'fuhrpark',
    name: 'Fuhrpark',
    description: 'Fahrzeuge, Fahrer und Wartungstermine verwalten',
    route: '/fuhrpark',
    icon: 'Car',
    category: 'tool',
    schema: 'fuhrpark',
    status: 'active',
  },
  {
    id: 'recruiting',
    name: 'Recruiting',
    description: 'Stellenempfehlungen und Bewerbungen verwalten',
    route: '/recruiting',
    icon: 'Users',
    category: 'company',
    company: 'seehafer',
    companyName: 'Seehafer Elemente',
    companyColor: '#2563EB',
    schema: 'recruiting',
    status: 'active',
  },
  {
    id: 'affiliate',
    name: 'Affiliate',
    description: 'Handwerkerempfehlungen und Auszahlungen verwalten',
    route: '/affiliate',
    icon: 'Share2',
    category: 'company',
    company: 'seehafer',
    companyName: 'Seehafer Elemente',
    companyColor: '#2563EB',
    schema: 'affiliate',
    status: 'active',
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Kundenbewertungen überwachen und beantworten',
    route: '/reviews',
    icon: 'Star',
    category: 'tool',
    status: 'coming_soon',
  },
];

/**
 * Icon-Zuordnung für Module.
 * WICHTIG: Nur in Client-Komponenten importieren (Lucide Icons sind React-Komponenten).
 * Wird von sidebar.tsx, mobile-nav.tsx und app/page.tsx verwendet.
 */
export { MODULE_ICONS } from './module-icons';

/** Nur aktive Module */
export const ACTIVE_MODULES = MODULES.filter((m) => m.status === 'active');

/** Modul nach ID suchen */
export function getModuleById(id: string): ModuleConfig | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Modul anhand der aktuellen Route erkennen */
export function getModuleByRoute(pathname: string): ModuleConfig | undefined {
  return MODULES.find((m) => pathname.startsWith(m.route));
}
