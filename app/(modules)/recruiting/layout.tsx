'use client';

import {
  LayoutDashboard,
  Briefcase,
  UserPlus,
  Wallet,
  Archive,
  Mail,
} from 'lucide-react';
import { ModuleSubnav, type ModuleNavItem } from '@/components/layout/module-subnav';

const NAV_ITEMS: ModuleNavItem[] = [
  { href: '/recruiting', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/recruiting/stellen', label: 'Stellen', icon: Briefcase },
  { href: '/recruiting/empfehlungen', label: 'Empfehlungen', icon: UserPlus },
  { href: '/recruiting/auszahlung', label: 'Auszahlung', icon: Wallet },
  { href: '/recruiting/archiv', label: 'Archiv', icon: Archive },
  { href: '/recruiting/emails', label: 'E-Mails', icon: Mail },
];

export default function RecruitingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <ModuleSubnav navItems={NAV_ITEMS}>{children}</ModuleSubnav>;
}
