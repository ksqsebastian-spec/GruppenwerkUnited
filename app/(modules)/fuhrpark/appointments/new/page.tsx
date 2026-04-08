'use client';

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AppointmentForm } from '@/components/appointments';

/**
 * Seite zum Anlegen eines neuen Termins
 */
export default function NewAppointmentPage(): React.JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Neuer Termin"
          description="Erstelle einen neuen Wartungs- oder Prüftermin"
          backHref="/fuhrpark/appointments"
        />

        <Suspense fallback={<LoadingSpinner text="Formular wird geladen..." />}>
          <AppointmentForm />
        </Suspense>
      </div>
    </AppLayout>
  );
}
