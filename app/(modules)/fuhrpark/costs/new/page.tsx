'use client';

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CostForm } from '@/components/costs';

/**
 * Seite zum Erfassen neuer Kosten
 */
export default function NewCostPage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Kosten erfassen"
          description="Erfasse neue Fuhrparkkosten"
          backHref="/fuhrpark/costs"
        />

        <Suspense fallback={<LoadingSpinner text="Formular wird geladen..." />}>
          <CostForm />
        </Suspense>
      </div>
    </AppLayout>
  );
}
