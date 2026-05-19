'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Checkbox } from '@/components/ui/checkbox';
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

interface VehicleFormLeasingSectionProps {
  form: UseFormReturn<VehicleFormData>;
}

/**
 * Kauf- und Leasing-Sektion des Fahrzeug-Formulars.
 * Leasing-Felder erscheinen nur wenn `is_leased` aktiv ist.
 */
export function VehicleFormLeasingSection({
  form,
}: VehicleFormLeasingSectionProps): React.JSX.Element {
  const isLeased = form.watch('is_leased');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kauf / Leasing</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="purchase_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kaufdatum</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purchase_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kaufpreis</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0,00"
                  suffix="€"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_leased"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Leasingfahrzeug</FormLabel>
                <FormDescription>Aktivieren wenn das Fahrzeug geleast ist</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {isLeased && (
          <>
            <FormField
              control={form.control}
              name="leasing_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leasinggeber</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. ALD Automotive" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leasing_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leasingende</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Ein Rückgabe-Termin wird automatisch erstellt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leasing_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monatliche Rate</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0,00"
                      suffix="€"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leasing_contract_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vertragsnummer</FormLabel>
                  <FormControl>
                    <Input placeholder="Leasing-Vertragsnummer" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
