'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  ChevronLeft,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLicenseWarningCount } from '@/hooks/use-license-control';
import { useUvvWarningCount } from '@/hooks/use-uvv-control';
import { MODULES, MODULE_ICONS, getModuleByRoute, type ModuleConfig } from '@/lib/modules';
import { useAuth } from '@/components/providers/auth-provider';

const fuhrparkNavigation = [
  { name: 'Dashboard',    href: '/fuhrpark',              icon: LayoutDashboard },
  { name: 'Fahrzeuge',    href: '/fuhrpark/vehicles',     icon: Car },
  { name: 'Fahrer',       href: '/fuhrpark/drivers',      icon: Users },
  { name: 'Termine',      href: '/fuhrpark/appointments', icon: Calendar },
  { name: 'Schäden',      href: '/fuhrpark/damages',      icon: AlertTriangle },
  { name: 'Kosten',       href: '/fuhrpark/costs',        icon: Euro },
  { name: 'Datenablage',  href: '/fuhrpark/documents',    icon: FolderOpen },
];

type BadgeType = 'uvv' | 'license' | null;

interface FuhrparkSecondaryNavItem {
  name: string;
  href: string;
  icon: typeof Shield;
  badgeType: BadgeType;
}

const fuhrparkSecondaryNavigation: FuhrparkSecondaryNavItem[] = [
  { name: 'UVV-Kontrolle',          href: '/fuhrpark/uvv',             icon: Shield,  badgeType: 'uvv'     },
  { name: 'Führerscheinkontrolle',  href: '/fuhrpark/license-control', icon: Contact, badgeType: 'license' },
  { name: 'Einstellungen',          href: '/fuhrpark/settings',        icon: Settings,badgeType: null      },
];

interface SidebarNavItemProps {
  href: string;
  name: string;
  icon: React.ElementType;
  isActive: boolean;
  badge?: number;
  comingSoon?: boolean;
}

function SidebarNavItem({
  href,
  name,
  icon: Icon,
  isActive,
  badge,
  comingSoon,
}: SidebarNavItemProps): React.JSX.Element {
  return (
    <li>
      <Link
        href={comingSoon ? '#' : href}
        className={cn(
          'group flex gap-x-3 rounded-full p-2 text-sm font-medium leading-6 transition-colors',
          isActive
            ? 'bg-[#e5e5e5] text-[#000000]'
            : comingSoon
              ? 'cursor-not-allowed text-[#a3a3a3]'
              : 'text-[#525252] hover:bg-[#f5f5f5] hover:text-[#000000]'
        )}
        aria-disabled={comingSoon}
      >
        <Icon
          className={cn(
            'h-5 w-5 shrink-0',
            isActive
              ? 'text-[#000000]'
              : 'text-[#737373] group-hover:text-[#525252]'
          )}
        />
        <span className="flex-1">{name}</span>
        {badge !== undefined && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#000000] px-1.5 text-xs font-medium text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {comingSoon && (
          <span className="rounded-full bg-[#e5e5e5] px-2 py-0.5 text-xs text-[#737373]">
            Bald
          </span>
        )}
      </Link>
    </li>
  );
}

function WerkbankModuleNav({ pathname }: { pathname: string }): React.JSX.Element {
  const { company } = useAuth();

  const allowedModules = company?.allowedModules;
  const visibleModules = MODULES.filter((m) => {
    if (allowedModules === '*') return true;
    if (Array.isArray(allowedModules)) return allowedModules.includes(m.id);
    return false;
  });

  const renderModuleItem = (mod: ModuleConfig): React.JSX.Element => {
    const Icon = MODULE_ICONS[mod.icon] ?? Wrench;
    const isActive = pathname.startsWith(mod.route);
    return (
      <SidebarNavItem
        key={mod.id}
        href={mod.route}
        name={mod.name}
        icon={Icon}
        isActive={isActive}
        comingSoon={mod.status === 'coming_soon'}
      />
    );
  };

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        {visibleModules.length > 0 && (
          <li>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#737373]">
              {company?.companyName ?? 'Module'}
            </div>
            <ul role="list" className="-mx-2 space-y-0.5">
              {visibleModules.map(renderModuleItem)}
            </ul>
          </li>
        )}
      </ul>
    </nav>
  );
}

function FuhrparkModuleNav({ pathname }: { pathname: string }): React.JSX.Element {
  const { data: licenseWarningCount } = useLicenseWarningCount();
  const { data: uvvWarningCount } = useUvvWarningCount();

  const isActive = (href: string): boolean => {
    if (href === '/fuhrpark') return pathname === '/fuhrpark';
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-0.5">
            {fuhrparkNavigation.map((item) => (
              <SidebarNavItem
                key={item.name}
                href={item.href}
                name={item.name}
                icon={item.icon}
                isActive={isActive(item.href)}
              />
            ))}
          </ul>
        </li>
        <li className="mt-auto">
          <ul role="list" className="-mx-2 space-y-0.5">
            {fuhrparkSecondaryNavigation.map((item) => {
              let badge: number | undefined;
              if (item.badgeType === 'uvv') badge = uvvWarningCount;
              else if (item.badgeType === 'license') badge = licenseWarningCount;
              return (
                <SidebarNavItem
                  key={item.name}
                  href={item.href}
                  name={item.name}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  badge={badge}
                />
              );
            })}
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const currentModule = getModuleByRoute(pathname);
  const isInsideModule = currentModule !== undefined;

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      {/* Ivory-Oberfläche mit Border Cream Trennlinie */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[#e5e5e5] bg-white px-6 pb-4">

        {/* Logo / Werkbank-Wordmark */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logos/ollama-icon.webp" width={28} height={28} alt="Gruppenwerk" className="rounded-lg" />
            <span className="font-semibold text-base text-[#000000] tracking-tight">Werkbank</span>
          </Link>
        </div>

        {/* Zurück zur Übersicht */}
        {isInsideModule && (
          <div className="border-b border-[#e5e5e5] pb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#737373] hover:text-[#000000] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Zur Übersicht
            </Link>
            <p className="mt-2 px-1 text-xs font-semibold uppercase tracking-wider text-[#737373]">
              {currentModule.name}
            </p>
          </div>
        )}

        {/* Kontextuelle Navigation */}
        {isInsideModule && currentModule.id === 'fuhrpark' ? (
          <FuhrparkModuleNav pathname={pathname} />
        ) : (
          <WerkbankModuleNav pathname={pathname} />
        )}
      </div>
    </aside>
  );
}
