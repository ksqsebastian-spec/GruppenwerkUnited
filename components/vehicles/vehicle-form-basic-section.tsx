'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleFormData } from '@/lib/validations/vehicle';
import type { Company } from '@/types';

interface VehicleFormBasicSectionProps {
  form: UseFormReturn<VehicleFormData>;
  companies: Company[] | undefined;
}

const FUEL_TYPES: Array<{ value: VehicleFormData['fuel_type']; label: string }> = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'benzin', label: 'Benzin' },
  { value: 'elektro', label: 'Elektro' },
  { value: 'hybrid_benzin', label: 'Hybrid (Benzin)' },
  { value: 'hybrid_diesel', label: 'Hybrid (Diesel)' },
  { value: 'gas', label: 'Gas' },
];

/**
 * Grunddaten-Sektion des Fahrzeug-Formulars: Kennzeichen, Firma, Marke, Modell,
 * Baujahr, Kraftstoff, VIN, Kilometerstand.
 */
export function VehicleFormBasicSection({
  form,
  companies,
}: VehicleFormBasicSectionProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grunddaten</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="license_plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kennzeichen *</FormLabel>
              <FormControl>
                <Input placeholder="z.B. HH-AB 1234" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firma *</FormLabel>
              {(!companies || companies.length === 0) ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  Keine Firmen vorhanden.{' '}
                  <a href="/fuhrpark/settings" className="text-primary underline hover:no-underline">
                    Bitte zuerst eine Firma anlegen.
                  </a>
                </div>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Firma auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marke *</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Mercedes" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modell *</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Sprinter" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Baujahr *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuel_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kraftstoff *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Kraftstoff auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUEL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fahrgestellnummer (VIN)</FormLabel>
              <FormControl>
                <Input placeholder="17-stellige VIN" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>
                Eindeutige Fahrzeug-Identifikationsnummer
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mileage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kilometerstand</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
