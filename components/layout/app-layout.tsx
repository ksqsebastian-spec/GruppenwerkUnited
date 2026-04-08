'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { AuthGuard } from '@/components/auth/auth-guard';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar für Desktop */}
        <Sidebar />

        {/* Hauptbereich */}
        <div className="lg:pl-64">
          {/* Header */}
          <Header />

          {/* Content */}
          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
