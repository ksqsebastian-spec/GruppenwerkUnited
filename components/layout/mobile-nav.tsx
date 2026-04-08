'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, Car, Users, Calendar, AlertTriangle, Euro, Settings, Contact, FolderOpen, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLicenseWarningCount } from '@/hooks/use-license-control';
import { useUvvWarningCount } from '@/hooks/use-uvv-control';

type BadgeType = 'uvv' | 'license' | null;

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badgeType: BadgeType;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, badgeType: null },
  { name: 'Fahrzeuge', href: '/vehicles', icon: Car, badgeType: null },
  { name: 'Fahrer', href: '/drivers', icon: Users, badgeType: null },
  { name: 'Termine', href: '/appointments', icon: Calendar, badgeType: null },
  { name: 'Schäden', href: '/damages', icon: AlertTriangle, badgeType: null },
  { name: 'Kosten', href: '/costs', icon: Euro, badgeType: null },
  { name: 'Datenablage', href: '/documents', icon: FolderOpen, badgeType: null },
  { name: 'UVV-Kontrolle', href: '/uvv', icon: Shield, badgeType: 'uvv' },
  { name: 'Führerscheinkontrolle', href: '/license-control', icon: Contact, badgeType: 'license' },
  { name: 'Einstellungen', href: '/settings', icon: Settings, badgeType: null },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps): JSX.Element | null {
  const pathname = usePathname();
  const { data: licenseWarningCount } = useLicenseWarningCount();
  const { data: uvvWarningCount } = useUvvWarningCount();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!open) return null;

  return (
    <div className="relative z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/80"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="fixed inset-0 flex">
        <div className="relative mr-16 flex w-full max-w-xs flex-1">
          {/* Schließen-Button */}
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Menü schließen</span>
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => onOpenChange(false)}
              >
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg">Fuhrpark</span>
              </Link>
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
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
                        onClick={() => onOpenChange(false)}
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
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
