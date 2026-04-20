'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { FuhrparkSubnav } from './fuhrpark-subnav';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MascotCrab } from '@/components/shared/mascot-crab';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  const pathname = usePathname();
  const isInFuhrpark = pathname.startsWith('/fuhrpark');
  const [showCrab, setShowCrab] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Haupt-Header mit Modul-Navigation */}
        <Header />

        {/* Fuhrpark Unter-Navigation */}
        {isInFuhrpark && <FuhrparkSubnav />}

        {/* Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>

        {/* Krabben-Toggle */}
        {!showCrab && (
          <button
            className="fixed bottom-3 left-3 z-40 text-lg leading-none opacity-40 hover:opacity-100 transition-opacity select-none"
            onClick={() => setShowCrab(true)}
            title="Maskottchen einblenden"
          >
            🦀
          </button>
        )}

        {/* Maskottchen */}
        {showCrab && <MascotCrab onHide={() => setShowCrab(false)} />}
      </div>
    </AuthGuard>
  );
}
