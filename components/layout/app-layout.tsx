'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { FuhrparkSubnav } from './fuhrpark-subnav';
import { AuthGuard } from '@/components/auth/auth-guard';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  const pathname = usePathname();
  const isInFuhrpark = pathname.startsWith('/fuhrpark');

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Haupt-Header mit Modul-Navigation */}
        <Header />

        {/* Fuhrpark Unter-Navigation */}
        {isInFuhrpark && <FuhrparkSubnav />}

        {/* Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
