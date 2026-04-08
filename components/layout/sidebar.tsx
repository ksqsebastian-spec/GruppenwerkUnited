'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  AlertTriangle,
  Euro,
  FolderOpen,
  Settings,
  Contact,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLicenseWarningCount } from '@/hooks/use-license-control';
import { useUvvWarningCount } from '@/hooks/use-uvv-control';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fahrzeuge', href: '/vehicles', icon: Car },
  { name: 'Fahrer', href: '/drivers', icon: Users },
  { name: 'Termine', href: '/appointments', icon: Calendar },
  { name: 'Schäden', href: '/damages', icon: AlertTriangle },
  { name: 'Kosten', href: '/costs', icon: Euro },
  { name: 'Datenablage', href: '/documents', icon: FolderOpen },
];

type BadgeType = 'uvv' | 'license' | null;

interface SecondaryNavItem {
  name: string;
  href: string;
  icon: typeof Shield;
  badgeType: BadgeType;
}

const secondaryNavigation: SecondaryNavItem[] = [
  { name: 'UVV-Kontrolle', href: '/uvv', icon: Shield, badgeType: 'uvv' },
  { name: 'Führerscheinkontrolle', href: '/license-control', icon: Contact, badgeType: 'license' },
  { name: 'Einstellungen', href: '/settings', icon: Settings, badgeType: null },
];

export function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const { data: licenseWarningCount } = useLicenseWarningCount();
  const { data: uvvWarningCount } = useUvvWarningCount();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Fuhrpark</span>
          </Link>
        </div>

        {/* Haupt-Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            active
                              ? 'text-primary'
                              : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Sekundäre Navigation (UVV, Führerscheinkontrolle & Einstellungen) */}
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  // Badge-Logik basierend auf Typ
                  let badgeCount: number | undefined;
                  if (item.badgeType === 'uvv') {
                    badgeCount = uvvWarningCount;
                  } else if (item.badgeType === 'license') {
                    badgeCount = licenseWarningCount;
                  }
                  const showBadge = badgeCount !== undefined && badgeCount > 0;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            active
                              ? 'text-primary'
                              : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        <span className="flex-1">{item.name}</span>
                        {showBadge && badgeCount && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
