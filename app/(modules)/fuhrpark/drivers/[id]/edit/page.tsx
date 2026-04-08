'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { DriverForm } from '@/components/drivers';
import { useDriver } from '@/hooks/use-drivers';

/**
 * Seite zum Bearbeiten eines Fahrers
 */
export default function EditDriverPage(): React.JSX.Element {
  const params = useParams();
  const driverId = params.id as string;

  const { data: driver, isLoading, error, refetch } = useDriver(driverId);

  if (isLoading) {
    return (
      <>
        <LoadingSpinner text="Fahrer wird geladen..." />
      </>
    );
  }

  if (error || !driver) {
    return (
      <>
        <ErrorState
          message="Fahrer konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Fahrer bearbeiten"
          description={`${driver.first_name} ${driver.last_name}`}
          backHref={`/fuhrpark/drivers/${driver.id}`}
        />

        <DriverForm driver={driver} />
      </div>
    </>
  );
}
