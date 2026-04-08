'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  UserPlus,
  Wallet,
  Archive,
  Mail,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { cn } from '@/lib/utils';

// Recruiting-Modul interne Navigation
const NAV_ITEMS = [
  { href: '/recruiting', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/recruiting/stellen', label: 'Stellen', icon: Briefcase, exact: false },
  { href: '/recruiting/empfehlungen', label: 'Empfehlungen', icon: UserPlus, exact: false },
  { href: '/recruiting/auszahlung', label: 'Auszahlung', icon: Wallet, exact: false },
  { href: '/recruiting/archiv', label: 'Archiv', icon: Archive, exact: false },
  { href: '/recruiting/emails', label: 'E-Mails', icon: Mail, exact: false },
];

interface RecruitingLayoutProps {
  children: React.ReactNode;
}

/**
 * Recruiting-Modul Layout – Sub-Navigation als Tab-Leiste
 */
export default function RecruitingLayout({ children }: RecruitingLayoutProps): JSX.Element {
  const pathname = usePathname();

  return (
    <AppLayout>
      {/* Sub-Navigation */}
      <div className="mb-6 overflow-x-auto">
        <nav className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </AppLayout>
  );
}
