'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/app-layout';

export interface ModuleNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** true = exakter Pfad-Vergleich, false = startsWith (Standard) */
  exact?: boolean;
}

interface ModuleSubnavProps {
  navItems: ModuleNavItem[];
  children: React.ReactNode;
}

/**
 * Gemeinsames Layout mit Tab-Navigationsleiste für Module.
 *
 * Wird verwendet von: Recruiting, Affiliate (und beliebig viele weitere Module).
 * Jedes Modul definiert nur noch sein eigenes NAV_ITEMS-Array.
 *
 * @example
 * ```tsx
 * const NAV_ITEMS: ModuleNavItem[] = [
 *   { href: '/recruiting', label: 'Dashboard', icon: LayoutDashboard, exact: true },
 *   { href: '/recruiting/stellen', label: 'Stellen', icon: Briefcase },
 * ];
 *
 * export default function RecruitingLayout({ children }) {
 *   return <ModuleSubnav navItems={NAV_ITEMS}>{children}</ModuleSubnav>;
 * }
 * ```
 */
export function ModuleSubnav({ navItems, children }: ModuleSubnavProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <AppLayout>
      {/* Sub-Navigation */}
      <div className="mb-6 overflow-x-auto">
        <nav className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {navItems.map((item) => {
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
                    ? 'bg-[#000000] text-white shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background/60'
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
