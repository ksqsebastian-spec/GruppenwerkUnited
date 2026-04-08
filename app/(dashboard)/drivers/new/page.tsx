'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { DriverForm } from '@/components/drivers';

/**
 * Seite zum Anlegen eines neuen Fahrers
 */
export default function NewDriverPage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Neuer Fahrer"
          description="Füge einen neuen Fahrer hinzu"
          backHref="/drivers"
        />

        <DriverForm />
      </div>
    </AppLayout>
  );
}
