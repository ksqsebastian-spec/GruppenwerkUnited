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
import type { DamageFormData } from '@/lib/validations/damage';

interface DamageFormCostsInsuranceProps {
  form: UseFormReturn<DamageFormData>;
  insuranceClaim: boolean;
}

/**
 * Karten für Kosten und Versicherungsangaben einer Schadensmeldung.
 */
export function DamageFormCostsInsurance({
  form,
  insuranceClaim,
}: DamageFormCostsInsuranceProps): React.JSX.Element {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kosten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="cost_estimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geschätzte Kosten</FormLabel>
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
            name="actual_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tatsächliche Kosten</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0,00"
                    suffix="€"
                  />
                </FormControl>
                <FormDescription>Nach Reparatur ausfüllen</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versicherung</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="insurance_claim"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Versicherungsfall</FormLabel>
                  <FormDescription>
                    Wird dieser Schaden über die Versicherung abgewickelt?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {insuranceClaim && (
            <FormField
              control={form.control}
              name="insurance_claim_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schadensnummer</FormLabel>
                  <FormControl>
                    <Input placeholder="Versicherungs-Schadensnummer" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
