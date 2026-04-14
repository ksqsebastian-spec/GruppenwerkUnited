'use client';

import { LayoutDashboard, ListFilter, History } from 'lucide-react';
import { ModuleSubnav, type ModuleNavItem } from '@/components/layout/module-subnav';

/**
 * VOB-Modul Navigation
 * Sub-Navigation mit Dashboard, Alle Ausschreibungen und Verlauf.
 */
const VOB_NAV_ITEMS: ModuleNavItem[] = [
  { href: '/vob', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/vob/alle', label: 'Alle Ausschreibungen', icon: ListFilter },
  { href: '/vob/verlauf', label: 'Verlauf', icon: History },
];

interface VobLayoutProps {
  children: React.ReactNode;
}

/**
 * VOB-Modul Layout – AppLayout mit Sub-Navigation
 */
export default function VobLayout({ children }: VobLayoutProps): React.JSX.Element {
  return <ModuleSubnav navItems={VOB_NAV_ITEMS}>{children}</ModuleSubnav>;
}
