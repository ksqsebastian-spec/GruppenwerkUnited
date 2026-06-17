import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface BilderLayoutProps {
  children: ReactNode;
}

export default function BilderLayout({ children }: BilderLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
