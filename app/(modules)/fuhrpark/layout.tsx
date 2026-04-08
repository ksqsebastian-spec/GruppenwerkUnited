import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Layout für den Dashboard-Bereich
 * Das AppLayout wird in den einzelnen Seiten verwendet
 */
export default function DashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  return <>{children}</>;
}
