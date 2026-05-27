import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface TicketsLayoutProps {
  children: ReactNode;
}

export default function TicketsLayout({ children }: TicketsLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
