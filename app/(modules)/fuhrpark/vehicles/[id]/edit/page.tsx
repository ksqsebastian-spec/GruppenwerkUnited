'use client';

import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { VehicleForm } from '@/components/vehicles';
import { useVehicle } from '@/hooks/use-vehicles';

/**
 * Seite zum Bearbeiten eines Fahrzeugs
 */
export default function EditVehiclePage(): JSX.Element {
  const params = useParams();
  const vehicleId = params.id as string;

  const { data: vehicle, isLoading, error, refetch } = useVehicle(vehicleId);

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner text="Fahrzeug wird geladen..." />
      </AppLayout>
    );
  }

  if (error || !vehicle) {
    return (
      <AppLayout>
        <ErrorState
          message="Fahrzeug konnte nicht geladen werden"
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Fahrzeug bearbeiten"
          description={`${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})`}
          backHref={`/fuhrpark/vehicles/${vehicle.id}`}
        />

        <VehicleForm vehicle={vehicle} />
      </div>
    </AppLayout>
  );
}
