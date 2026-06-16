import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface KundenLayoutProps {
  children: ReactNode;
}

export default function KundenLayout({ children }: KundenLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
