'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Car } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { VehicleTable, VehicleFilters } from '@/components/vehicles';
import { useVehicles } from '@/hooks/use-vehicles';
import type { VehicleFilters as VehicleFiltersType } from '@/types';

/**
 * Fahrzeugübersicht - Liste aller Fahrzeuge im Fuhrpark
 */
export default function VehiclesPage(): JSX.Element {
  const [filters, setFilters] = useState<VehicleFiltersType>({
    status: 'active',
  });

  const { data: vehicles, isLoading, error, refetch } = useVehicles(filters);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Fahrzeuge"
          description="Verwalte alle Fahrzeuge deines Fuhrparks"
        >
          <Button asChild>
            <Link href="/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Neues Fahrzeug
            </Link>
          </Button>
        </PageHeader>

        {/* Filter */}
        <VehicleFilters filters={filters} onFiltersChange={setFilters} />

        {/* Inhalt */}
        {isLoading ? (
          <LoadingSpinner text="Fahrzeuge werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Fahrzeuge konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !vehicles || vehicles.length === 0 ? (
          <EmptyState
            icon={<Car className="h-12 w-12 text-muted-foreground" />}
            title="Keine Fahrzeuge gefunden"
            description={
              filters.search || filters.companyId || filters.fuelType
                ? 'Keine Fahrzeuge entsprechen deinen Filterkriterien.'
                : 'Lege dein erstes Fahrzeug an, um zu beginnen.'
            }
            action={
              !filters.search && !filters.companyId && !filters.fuelType ? (
                <Button asChild>
                  <Link href="/vehicles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Erstes Fahrzeug anlegen
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setFilters({ status: 'active' })}>
                  Filter zurücksetzen
                </Button>
              )
            }
          />
        ) : (
          <VehicleTable vehicles={vehicles} />
        )}
      </div>
    </AppLayout>
  );
}
