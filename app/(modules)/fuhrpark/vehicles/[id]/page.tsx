'use client';

import { useParams } from 'next/navigation';
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
      <>
        <LoadingSpinner text="Fahrzeug wird geladen..." />
      </>
    );
  }

  if (error || !vehicle) {
    return (
      <>
        <ErrorState
          message="Fahrzeug konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <VehicleDetail vehicle={vehicle} />
    </>
  );
}
