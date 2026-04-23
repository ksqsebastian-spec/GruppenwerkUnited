import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

interface AutomatisierungenLayoutProps {
  children: ReactNode;
}

export default function AutomatisierungenLayout({
  children,
}: AutomatisierungenLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
