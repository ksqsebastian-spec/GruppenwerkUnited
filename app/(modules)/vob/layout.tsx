'use client';

import { AppLayout } from '@/components/layout/app-layout';

interface VobLayoutProps {
  children: React.ReactNode;
}

/**
 * VOB-Modul Layout – Werkbank AppLayout (Sidebar + Header + Auth-Guard)
 */
export default function VobLayout({ children }: VobLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
