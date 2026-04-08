'use client';

import { AppLayout } from '@/components/layout/app-layout';

interface FuhrparkLayoutProps {
  children: React.ReactNode;
}

/**
 * Fuhrpark-Modul Layout – Werkbank AppLayout (Sidebar + Header + Auth-Guard)
 */
export default function FuhrparkLayout({ children }: FuhrparkLayoutProps): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}
