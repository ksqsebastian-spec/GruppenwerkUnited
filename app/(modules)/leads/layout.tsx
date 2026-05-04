import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface LeadsLayoutProps {
  children: ReactNode;
}

export default function LeadsLayout({ children }: LeadsLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
