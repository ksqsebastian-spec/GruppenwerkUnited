'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CostTable, CostSummary } from '@/components/costs';
import { useCosts, useCostTypes } from '@/hooks/use-costs';
import { useVehicles } from '@/hooks/use-vehicles';
import type { CostFilters } from '@/types';

/**
 * Kostenübersicht - Liste aller Kosten
 */
export default function CostsPage(): React.JSX.Element {
  const [filters, setFilters] = useState<CostFilters>({});

  const { data: costs, isLoading, error, refetch } = useCosts(filters);
  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: costTypes } = useCostTypes();

  const handleVehicleChange = (value: string): void => {
    setFilters({
      ...filters,
      vehicleId: value === 'all' ? undefined : value,
    });
  };

  const handleCostTypeChange = (value: string): void => {
    setFilters({
      ...filters,
      costTypeId: value === 'all' ? undefined : value,
    });
  };

  const handleDateFromChange = (value: string): void => {
    setFilters({
      ...filters,
      dateFrom: value ? new Date(value) : undefined,
    });
  };

  const handleDateToChange = (value: string): void => {
    setFilters({
      ...filters,
      dateTo: value ? new Date(value) : undefined,
    });
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Kosten"
          description="Erfasse und analysiere Fuhrparkkosten"
        >
          <Button asChild>
            <Link href="/fuhrpark/costs/new">
              <Plus className="mr-2 h-4 w-4" />
              Kosten erfassen
            </Link>
          </Button>
        </PageHeader>

        {/* Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={filters.vehicleId ?? 'all'}
            onValueChange={handleVehicleChange}
          >
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Fahrzeug filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Fahrzeuge</SelectItem>
              {vehicles?.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.costTypeId ?? 'all'}
            onValueChange={handleCostTypeChange}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Kostenart filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kostenarten</SelectItem>
              {costTypes?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Von:</span>
            <Input
              type="date"
              className="w-[150px]"
              value={filters.dateFrom?.toISOString().split('T')[0] ?? ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Bis:</span>
            <Input
              type="date"
              className="w-[150px]"
              value={filters.dateTo?.toISOString().split('T')[0] ?? ''}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </div>

          {(filters.vehicleId || filters.costTypeId || filters.dateFrom || filters.dateTo) && (
            <Button
              variant="ghost"
              onClick={() => setFilters({})}
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>

        {/* Inhalt */}
        {isLoading ? (
          <LoadingSpinner text="Kosten werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Kosten konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !costs || costs.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-12 w-12 text-muted-foreground" />}
            title="Keine Kosten gefunden"
            description={
              filters.vehicleId || filters.costTypeId || filters.dateFrom || filters.dateTo
                ? 'Keine Kosten entsprechen deinen Filterkriterien.'
                : 'Noch keine Kosten erfasst.'
            }
            action={
              !filters.vehicleId && !filters.costTypeId && !filters.dateFrom && !filters.dateTo ? (
                <Button asChild>
                  <Link href="/fuhrpark/costs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Kosten erfassen
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setFilters({})}>
                  Filter zurücksetzen
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CostTable costs={costs} />
            </div>
            <div>
              <CostSummary costs={costs} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
