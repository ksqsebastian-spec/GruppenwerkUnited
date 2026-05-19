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

interface VehicleFormHolderSectionProps {
  form: UseFormReturn<VehicleFormData>;
}

/**
 * Halter- und Nutzer-Sektion des Fahrzeug-Formulars.
 */
export function VehicleFormHolderSection({
  form,
}: VehicleFormHolderSectionProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Halter & Nutzer</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="holder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fahrzeughalter</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Max Mustermann GmbH" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Eingetragener Besitzer des Fahrzeugs</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="user_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hauptnutzer</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Hans Müller" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Person die das Fahrzeug hauptsächlich nutzt</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
