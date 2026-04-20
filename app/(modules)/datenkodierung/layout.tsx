import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface DatenkodierungLayoutProps {
  children: ReactNode;
}

export default function DatenkodierungLayout({ children }: DatenkodierungLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
