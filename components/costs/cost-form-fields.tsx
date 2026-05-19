'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CostFormData } from '@/lib/validations/cost';

export interface VehicleOption {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
}

export interface CostTypeOption {
  id: string;
  name: string;
  icon?: string | null;
}

interface CostFormFieldsProps {
  form: UseFormReturn<CostFormData>;
  vehicles: VehicleOption[] | undefined;
  costTypes: CostTypeOption[] | undefined;
}

/**
 * Formularfelder für die Kostenerfassung.
 */
export function CostFormFields({ form, vehicles, costTypes }: CostFormFieldsProps): React.JSX.Element {
  return (
    <>
      <FormField
        control={form.control}
        name="vehicle_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fahrzeug *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Fahrzeug auswählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cost_type_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kostenart *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Kostenart auswählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {costTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon ? `${type.icon} ` : ''}
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Datum *</FormLabel>
            <FormControl>
              <Input type="date" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Betrag *</FormLabel>
            <FormControl>
              <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0,00" suffix="€" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mileage_at_cost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kilometerstand</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                placeholder="Aktueller Kilometerstand"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            </FormControl>
            <FormDescription>Wird automatisch aktualisiert</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Beschreibung</FormLabel>
            <FormControl>
              <Input placeholder="z.B. Super E10 bei Shell Tankstelle" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
