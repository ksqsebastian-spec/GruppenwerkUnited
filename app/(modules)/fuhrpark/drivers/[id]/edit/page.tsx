'use client';

import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { DriverForm } from '@/components/drivers';
import { useDriver } from '@/hooks/use-drivers';

/**
 * Seite zum Bearbeiten eines Fahrers
 */
export default function EditDriverPage(): JSX.Element {
  const params = useParams();
  const driverId = params.id as string;

  const { data: driver, isLoading, error, refetch } = useDriver(driverId);

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner text="Fahrer wird geladen..." />
      </AppLayout>
    );
  }

  if (error || !driver) {
    return (
      <AppLayout>
        <ErrorState
          message="Fahrer konnte nicht geladen werden"
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Fahrer bearbeiten"
          description={`${driver.first_name} ${driver.last_name}`}
          backHref={`/fuhrpark/drivers/${driver.id}`}
        />

        <DriverForm driver={driver} />
      </div>
    </AppLayout>
  );
}
