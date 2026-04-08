'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanies } from '@/hooks/use-companies';
import type { VehicleFilters as VehicleFiltersType, FuelType, VehicleStatus } from '@/types';

interface VehicleFiltersProps {
  /** Aktuelle Filter-Werte */
  filters: VehicleFiltersType;
  /** Callback wenn Filter geändert werden */
  onFiltersChange: (filters: VehicleFiltersType) => void;
}

/**
 * Kraftstofftypen für das Filter-Dropdown
 */
const fuelTypes: { value: FuelType; label: string }[] = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'benzin', label: 'Benzin' },
  { value: 'elektro', label: 'Elektro' },
  { value: 'hybrid_benzin', label: 'Hybrid (Benzin)' },
  { value: 'hybrid_diesel', label: 'Hybrid (Diesel)' },
  { value: 'gas', label: 'Gas' },
];

/**
 * Status-Optionen für das Filter-Dropdown
 */
const statusOptions: { value: VehicleStatus; label: string }[] = [
  { value: 'active', label: 'Aktiv' },
  { value: 'archived', label: 'Archiviert' },
];

/**
 * Filter-Komponente für die Fahrzeugliste
 */
export function VehicleFilters({
  filters,
  onFiltersChange,
}: VehicleFiltersProps): React.JSX.Element {
  const { data: companies } = useCompanies();

  const handleSearchChange = (value: string): void => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleCompanyChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      companyId: value === 'all' ? undefined : value,
    });
  };

  const handleFuelTypeChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      fuelType: value === 'all' ? undefined : (value as FuelType),
    });
  };

  const handleStatusChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as VehicleStatus),
    });
  };

  const handleClearFilters = (): void => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.search || filters.companyId || filters.fuelType || filters.status;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Suchfeld */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Fahrzeuge suchen (Kennzeichen, Marke, Modell)..."
          value={filters.search ?? ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Firma Filter */}
      <Select
        value={filters.companyId ?? 'all'}
        onValueChange={handleCompanyChange}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Firma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Firmen</SelectItem>
          {companies?.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Kraftstoff Filter */}
      <Select
        value={filters.fuelType ?? 'all'}
        onValueChange={handleFuelTypeChange}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Kraftstoff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Kraftstoffe</SelectItem>
          {fuelTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter zurücksetzen */}
      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={handleClearFilters}>
          <X className="h-4 w-4" />
          <span className="sr-only">Filter zurücksetzen</span>
        </Button>
      )}
    </div>
  );
}
