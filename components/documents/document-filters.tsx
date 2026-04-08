'use client';

import { X, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useDocumentTypes } from '@/hooks/use-documents';
import { useVehicles } from '@/hooks/use-vehicles';
import type { DocumentFilters as DocumentFiltersType, DocumentEntityType } from '@/types';

interface DocumentFiltersProps {
  /** Aktuelle Filter */
  filters: DocumentFiltersType;
  /** Callback wenn Filter geändert werden */
  onFiltersChange: (filters: DocumentFiltersType) => void;
}

/** Entity-Typ Optionen */
const entityTypeOptions: { value: DocumentEntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle Herkunft' },
  { value: 'vehicle', label: 'Fahrzeug' },
  { value: 'damage', label: 'Schaden' },
  { value: 'appointment', label: 'Termin' },
  { value: 'driver', label: 'Fahrer' },
];

/** Dateityp Optionen */
const fileTypeOptions: { value: 'all' | 'pdf' | 'image'; label: string }[] = [
  { value: 'all', label: 'Alle Dateitypen' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Bilder' },
];

/**
 * Zählt die aktiven Filter
 */
function countActiveFilters(filters: DocumentFiltersType): number {
  let count = 0;
  if (filters.entityType) count++;
  if (filters.documentTypeId) count++;
  if (filters.vehicleId) count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  if (filters.fileType && filters.fileType !== 'all') count++;
  return count;
}

/**
 * Filter-Komponente für die Datenablage
 */
export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps): JSX.Element {
  const { data: documentTypes } = useDocumentTypes();
  const { data: vehicles } = useVehicles({ status: 'active' });

  const activeFilterCount = countActiveFilters(filters);

  const handleReset = (): void => {
    onFiltersChange({});
  };

  const handleEntityTypeChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      entityType: value === 'all' ? undefined : value as DocumentEntityType,
    });
  };

  const handleDocumentTypeChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      documentTypeId: value === 'all' ? undefined : value,
    });
  };

  const handleVehicleChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      vehicleId: value === 'all' ? undefined : value,
    });
  };

  const handleFileTypeChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      fileType: value === 'all' ? undefined : value as 'pdf' | 'image',
    });
  };

  const handleDateFromChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      dateFrom: value || undefined,
    });
  };

  const handleDateToChange = (value: string): void => {
    onFiltersChange({
      ...filters,
      dateTo: value || undefined,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>
            Filtere die Dokumente nach verschiedenen Kriterien
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Herkunft / Entity-Typ */}
          <div className="space-y-2">
            <Label>Herkunft</Label>
            <Select
              value={filters.entityType ?? 'all'}
              onValueChange={handleEntityTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Herkunft" />
              </SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dokumenttyp */}
          <div className="space-y-2">
            <Label>Dokumenttyp</Label>
            <Select
              value={filters.documentTypeId ?? 'all'}
              onValueChange={handleDocumentTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Dokumenttypen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Dokumenttypen</SelectItem>
                {documentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fahrzeug */}
          <div className="space-y-2">
            <Label>Fahrzeug</Label>
            <Select
              value={filters.vehicleId ?? 'all'}
              onValueChange={handleVehicleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Fahrzeuge" />
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
          </div>

          {/* Dateityp */}
          <div className="space-y-2">
            <Label>Dateityp</Label>
            <Select
              value={filters.fileType ?? 'all'}
              onValueChange={handleFileTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Dateitypen" />
              </SelectTrigger>
              <SelectContent>
                {fileTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zeitraum */}
          <div className="space-y-2">
            <Label>Zeitraum</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Von</Label>
                <Input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bis</Label>
                <Input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={(e) => handleDateToChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
