'use client';

import { LayoutDashboard, ListFilter, History } from 'lucide-react';
import { ModuleSubnav, type ModuleNavItem } from '@/components/layout/module-subnav';

/**
 * Immobilien-Modul Navigation
 * Sub-Navigation mit Dashboard, Alle Inserate und Verlauf.
 */
const IMMO_NAV_ITEMS: ModuleNavItem[] = [
  { href: '/immo', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/immo/alle', label: 'Alle Inserate', icon: ListFilter },
  { href: '/immo/verlauf', label: 'Verlauf', icon: History },
];

interface ImmoLayoutProps {
  children: React.ReactNode;
}

/**
 * Immobilien-Modul Layout – AppLayout mit Sub-Navigation
 */
export default function ImmoLayout({ children }: ImmoLayoutProps): React.JSX.Element {
  return <ModuleSubnav navItems={IMMO_NAV_ITEMS}>{children}</ModuleSubnav>;
}
