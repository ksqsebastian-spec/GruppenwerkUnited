'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';

// ROI-Modul interne Navigation
const NAV_ITEMS = [
  { href: '/roi/dashboard', label: 'Aufträge' },
  { href: '/roi/dashboard/roi', label: 'ROI-Rechnung' },
  { href: '/roi/dashboard/flywheel', label: 'Flywheel' },
  { href: '/roi/dashboard/ausgaben', label: 'Ausgaben' },
  { href: '/roi/dashboard/bestpractices', label: 'Best Practice' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * ROI-Modul Layout – enthält die modulinterne Navigation (Tabs)
 * Wird von der Werkbank AppLayout umschlossen
 */
export default function RoiDashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  const pathname = usePathname();

  return (
    <AppLayout>
      {/* ROI-Modul Sub-Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">ROI Dashboard</h1>
        </div>
        <nav className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/roi/dashboard'
                ? pathname === '/roi/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
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
