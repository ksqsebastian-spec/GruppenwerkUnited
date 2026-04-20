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

const fuhrparkNavItems = [
  { name: 'Dashboard', href: '/fuhrpark', icon: LayoutDashboard, exact: true, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Fahrzeuge', href: '/fuhrpark/vehicles', icon: Car, exact: false, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Fahrer', href: '/fuhrpark/drivers', icon: Users, exact: false, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Termine', href: '/fuhrpark/appointments', icon: Calendar, exact: false, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Schäden', href: '/fuhrpark/damages', icon: AlertTriangle, exact: false, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Kosten', href: '/fuhrpark/costs', icon: Euro, exact: false, badgeType: null as 'uvv' | 'license' | null },
  { name: 'Datenablage', href: '/fuhrpark/documents', icon: FolderOpen, exact: false, badgeType: null as 'uvv' | 'license' | null },
  { name: 'UVV', href: '/fuhrpark/uvv', icon: Shield, exact: false, badgeType: 'uvv' as 'uvv' | 'license' | null },
  { name: 'Führerschein', href: '/fuhrpark/license-control', icon: Contact, exact: false, badgeType: 'license' as 'uvv' | 'license' | null },
  { name: 'Einstellungen', href: '/fuhrpark/settings', icon: Settings, exact: false, badgeType: null as 'uvv' | 'license' | null },
];

/** Horizontale Unter-Navigation für das Fuhrpark-Modul */
export function FuhrparkSubnav(): React.JSX.Element {
  const pathname = usePathname();
  const { data: licenseWarningCount } = useLicenseWarningCount();
  const { data: uvvWarningCount } = useUvvWarningCount();

  const isActive = (href: string, exact: boolean): boolean => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="border-b bg-card">
      <div className="px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-x-0.5 overflow-x-auto">
          {fuhrparkNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            let badge: number | undefined;
            if (item.badgeType === 'uvv') badge = uvvWarningCount;
            else if (item.badgeType === 'license') badge = licenseWarningCount;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
                {badge !== undefined && badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
