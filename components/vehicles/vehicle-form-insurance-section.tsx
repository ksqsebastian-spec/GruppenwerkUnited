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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleFormData } from '@/lib/validations/vehicle';

interface VehicleFormInsuranceSectionProps {
  form: UseFormReturn<VehicleFormData>;
}

/**
 * Versicherungs- und TÜV-Sektion des Fahrzeug-Formulars.
 */
export function VehicleFormInsuranceSection({
  form,
}: VehicleFormInsuranceSectionProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Versicherung & TÜV</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="insurance_company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Versicherung</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Allianz" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="insurance_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Versicherungsnummer</FormLabel>
              <FormControl>
                <Input placeholder="Vertragsnummer" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tuv_due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TÜV fällig</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Nächster TÜV-Termin</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
