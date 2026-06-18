import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface MarkitdownLayoutProps {
  children: ReactNode;
}

export default function MarkitdownLayout({ children }: MarkitdownLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
