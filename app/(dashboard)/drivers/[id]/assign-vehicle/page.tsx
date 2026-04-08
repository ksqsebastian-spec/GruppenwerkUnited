'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { AssignVehicleToDriver } from '@/components/shared/driver-assignment';
import { useDriver } from '@/hooks/use-drivers';

/**
 * Seite zum Zuweisen von Fahrzeugen zu einem Fahrer
 */
export default function AssignVehiclePage(): JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const { data: driver, isLoading, error, refetch } = useDriver(id);

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

  const driverName = `${driver.first_name} ${driver.last_name}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Zurück-Link */}
        <Button variant="ghost" asChild className="-ml-4">
          <Link href={`/drivers/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Fahrer
          </Link>
        </Button>

        {/* Header */}
        <PageHeader
          title="Fahrzeug zuweisen"
          description={`Fahrer: ${driverName}`}
        />

        {/* Zuweisungs-Komponente */}
        <div className="max-w-2xl">
          <AssignVehicleToDriver
            driverId={id}
            driverName={driverName}
          />
        </div>
      </div>
    </AppLayout>
  );
}
