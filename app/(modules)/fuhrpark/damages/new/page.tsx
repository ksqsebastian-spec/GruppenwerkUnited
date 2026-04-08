'use client';

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { DamageForm } from '@/components/damages';

/**
 * Seite zum Melden eines neuen Schadens
 */
export default function NewDamagePage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Schaden melden"
          description="Dokumentiere einen neuen Schaden"
          backHref="/fuhrpark/damages"
        />

        <Suspense fallback={<LoadingSpinner text="Formular wird geladen..." />}>
          <DamageForm />
        </Suspense>
      </div>
    </AppLayout>
  );
}
