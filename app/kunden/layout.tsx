import type { ReactNode } from 'react';

interface KundenLayoutProps {
  children: ReactNode;
}

/**
 * Layout für öffentliche Kunden-Seiten (Empfehlungsportale).
 * Kein Auth-Guard, keine Sidebar – reine Public-Seiten.
 */
export default function KundenLayout({ children }: KundenLayoutProps): React.JSX.Element {
  return <>{children}</>;
}
