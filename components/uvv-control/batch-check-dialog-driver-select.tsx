'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormLabel } from '@/components/ui/form';

export interface BatchDriverOption {
  id: string;
  first_name: string;
  last_name: string;
  company?: { name: string } | null;
}

interface BatchCheckDriverSelectProps {
  drivers: BatchDriverOption[] | undefined;
  selectedDriverIds: string[];
  onToggleDriver: (driverId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

/**
 * Fahrer-Auswahl-Liste mit Sammel-Aktionen für die UVV-Sammelunterweisung.
 */
export function BatchCheckDriverSelect({
  drivers,
  selectedDriverIds,
  onToggleDriver,
  onSelectAll,
  onDeselectAll,
}: BatchCheckDriverSelectProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>Fahrer auswählen *</FormLabel>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
            Alle auswählen
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDeselectAll}>
            Keine auswählen
          </Button>
        </div>
      </div>
      <div className="h-[200px] rounded-md border p-4 overflow-y-auto">
        <div className="space-y-2">
          {drivers?.map((driver) => (
            <div key={driver.id} className="flex items-center space-x-2">
              <Checkbox
                id={`driver-${driver.id}`}
                checked={selectedDriverIds.includes(driver.id)}
                onCheckedChange={() => onToggleDriver(driver.id)}
              />
              <label
                htmlFor={`driver-${driver.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {driver.first_name} {driver.last_name}
                {driver.company && (
                  <span className="text-muted-foreground ml-2">({driver.company.name})</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{selectedDriverIds.length} Fahrer ausgewählt</p>
    </div>
  );
}
