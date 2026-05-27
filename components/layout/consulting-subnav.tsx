'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const consultingNavItems = [
  { name: 'Übersicht', href: '/consulting', icon: LayoutDashboard, exact: true },
  { name: 'Einstellungen', href: '/consulting/einstellungen', icon: Settings, exact: false },
];

export function ConsultingSubnav(): React.JSX.Element {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean): boolean => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="border-b bg-card">
      <div className="px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-x-0.5 overflow-x-auto">
          {consultingNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
