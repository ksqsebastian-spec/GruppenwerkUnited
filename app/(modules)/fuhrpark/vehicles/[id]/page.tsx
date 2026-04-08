'use client';

import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { VehicleDetail } from '@/components/vehicles';
import { useVehicle } from '@/hooks/use-vehicles';

/**
 * Fahrzeug-Detailseite
 */
export default function VehicleDetailPage(): React.JSX.Element {
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
      <VehicleDetail vehicle={vehicle} />
    </AppLayout>
  );
}
