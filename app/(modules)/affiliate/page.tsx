'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

/**
 * Affiliate – wird in Phase 4 migriert
 * Erfordert: Migration der API-Routen + Types
 */
export default function AffiliatePage(): JSX.Element {
  return (
    <AppLayout>
      <ModulePlaceholder moduleName="Affiliate" />
    </AppLayout>
  );
}
