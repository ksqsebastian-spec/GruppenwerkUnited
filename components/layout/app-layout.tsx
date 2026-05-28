'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppSidebar } from './app-sidebar';
import { MobileNav } from './mobile-nav';
import { FuhrparkSubnav } from './fuhrpark-subnav';
import { ConsultingSubnav } from './consulting-subnav';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MascotCrab } from '@/components/shared/mascot-crab';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'werkbank_sidebar_collapsed';

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  const pathname = usePathname();
  const isInFuhrpark = pathname.startsWith('/fuhrpark');
  const isInConsulting = pathname.startsWith('/consulting');

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Eingeklappt-Zustand aus dem Browser wiederherstellen
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const toggleCollapsed = (): void => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Einklappbare Seitenleiste (Desktop) */}
        <AppSidebar collapsed={collapsed} onToggle={toggleCollapsed} />

        {/* Schlanke Kopfzeile nur auf Mobil – öffnet das Menü */}
        <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-x-3 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menü öffnen</span>
          </Button>
          <Link href="/" className="flex items-center">
            <div className="h-7 w-7 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-background leading-none tracking-tight">GW</span>
            </div>
          </Link>
        </div>

        <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Inhalt – auf Desktop um die Seitenleiste eingerückt */}
        <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
          {isInFuhrpark && <FuhrparkSubnav />}
          {isInConsulting && <ConsultingSubnav />}

          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>

        {/* Bett-Icon */}
        <MascotCrab />
      </div>
    </AuthGuard>
  );
}
