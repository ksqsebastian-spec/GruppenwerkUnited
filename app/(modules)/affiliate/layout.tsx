'use client';

import {
  LayoutDashboard,
  Hammer,
  UserPlus,
  Wallet,
  Archive,
  Mail,
} from 'lucide-react';
import { ModuleSubnav, type ModuleNavItem } from '@/components/layout/module-subnav';

const NAV_ITEMS: ModuleNavItem[] = [
  { href: '/affiliate', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/affiliate/handwerker', label: 'Handwerker', icon: Hammer },
  { href: '/affiliate/empfehlungen', label: 'Empfehlungen', icon: UserPlus },
  { href: '/affiliate/auszahlung', label: 'Auszahlung', icon: Wallet },
  { href: '/affiliate/archiv', label: 'Archiv', icon: Archive },
  { href: '/affiliate/emails', label: 'E-Mails', icon: Mail },
];

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <ModuleSubnav navItems={NAV_ITEMS}>{children}</ModuleSubnav>;
}
