'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  AlertTriangle,
  Euro,
  Settings,
  Contact,
  FolderOpen,
  Shield,
  ChevronLeft,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLicenseWarningCount } from '@/hooks/use-license-control';
import { useUvvWarningCount } from '@/hooks/use-uvv-control';
import { MODULES, MODULE_ICONS, getModuleByRoute } from '@/lib/modules';
import { useAuth } from '@/components/providers/auth-provider';

const fuhrparkNavigation = [
  { name: 'Dashboard', href: '/fuhrpark', icon: LayoutDashboard, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Fahrzeuge', href: '/fuhrpark/vehicles', icon: Car, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Fahrer', href: '/fuhrpark/drivers', icon: Users, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Termine', href: '/fuhrpark/appointments', icon: Calendar, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Schäden', href: '/fuhrpark/damages', icon: AlertTriangle, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Kosten', href: '/fuhrpark/costs', icon: Euro, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Datenablage', href: '/fuhrpark/documents', icon: FolderOpen, badgeType: null as 'uvv' | 'license' | null },
  { name: 'UVV-Kontrolle', href: '/fuhrpark/uvv', icon: Shield, badgeType: 'uvv' as 'uvv' | 'license' | null },
  { name: 'Führerscheinkontrolle', href: '/fuhrpark/license-control', icon: Contact, badgeType: 'license' as 'uvv' | 'license' | null },
  { name: 'Einstellungen', href: '/fuhrpark/settings', icon: Settings, badgeType: null as 'uvv' | 'license' | null },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps): React.JSX.Element | null {
  const pathname = usePathname();
  const { company } = useAuth();
  const { data: licenseWarningCount } = useLicenseWarningCount();
  const { data: uvvWarningCount } = useUvvWarningCount();
  const { company } = useAuth();
  const currentModule = getModuleByRoute(pathname);
  const isInsideModule = currentModule !== undefined;

  const isActive = (href: string): boolean => {
    if (href === '/fuhrpark') return pathname === '/fuhrpark';
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (!open) return null;

  // Nur erlaubte Module anzeigen
  const allowedModules = company?.allowedModules;
  const visibleModules = MODULES.filter((m) => {
    if (allowedModules === '*') return true;
    if (Array.isArray(allowedModules)) return allowedModules.includes(m.id);
    return false;
  });

  // Navigationseinträge basierend auf aktuellem Modul
  const navItems = isInsideModule && currentModule.id === 'fuhrpark'
    ? fuhrparkNavigation
    : visibleModules.map((mod) => ({
        name: mod.name,
        href: mod.route,
        icon: MODULE_ICONS[mod.icon] ?? Wrench,
        badgeType: null as 'uvv' | 'license' | null,
        disabled: mod.status === 'coming_soon',
      }));

  return (
    <div className="relative z-50 lg:hidden">
      {/* Hintergrundoverlay */}
      <div
        className="fixed inset-0 bg-foreground/80"
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
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => onOpenChange(false)}
              >
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg">Werkbank</span>
              </Link>
            </div>

            {/* Zurück zur Übersicht (nur innerhalb eines Moduls) */}
            {isInsideModule && (
              <div className="border-b pb-4">
                <Link
                  href="/"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Zur Übersicht
                </Link>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {currentModule.name}
                </p>
              </div>
            )}

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="-mx-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  // Badge-Logik
                  let badgeCount: number | undefined;
                  if (item.badgeType === 'uvv') badgeCount = uvvWarningCount;
                  else if (item.badgeType === 'license') badgeCount = licenseWarningCount;
                  const showBadge = badgeCount !== undefined && badgeCount > 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            active
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-muted-foreground'
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
