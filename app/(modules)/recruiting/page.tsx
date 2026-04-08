'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

/**
 * Recruiting – wird in Phase 4 migriert
 * Erfordert: Migration der API-Routen + Types
 */
export default function RecruitingPage(): JSX.Element {
  return (
    <AppLayout>
      <ModulePlaceholder moduleName="Recruiting" />
    </AppLayout>
  );
}
