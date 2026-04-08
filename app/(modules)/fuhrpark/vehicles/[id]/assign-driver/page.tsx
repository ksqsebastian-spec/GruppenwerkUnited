'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { AssignDriverToVehicle } from '@/components/shared/driver-assignment';
import { useVehicle } from '@/hooks/use-vehicles';

/**
 * Seite zum Zuweisen von Fahrern zu einem Fahrzeug
 */
export default function AssignDriverPage(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const { data: vehicle, isLoading, error, refetch } = useVehicle(id);

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
      <div className="space-y-6">
        {/* Zurück-Link */}
        <Button variant="ghost" asChild className="-ml-4">
          <Link href={`/fuhrpark/vehicles/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Fahrzeug
          </Link>
        </Button>

        {/* Header */}
        <PageHeader
          title="Fahrer zuweisen"
          description={`${vehicle.license_plate} – ${vehicle.brand} ${vehicle.model}`}
        />

        {/* Zuweisungs-Komponente */}
        <div className="max-w-2xl">
          <AssignDriverToVehicle
            vehicleId={id}
            vehiclePlate={vehicle.license_plate}
          />
        </div>
      </div>
    </>
  );
}
