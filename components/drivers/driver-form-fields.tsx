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
import type { DriverFormData } from '@/lib/validations/driver';

const licenseClasses = [
  { value: 'AM', label: 'AM - Mopeds/Quads' },
  { value: 'A1', label: 'A1 - Leichtkrafträder' },
  { value: 'A2', label: 'A2 - Krafträder bis 35kW' },
  { value: 'A', label: 'A - Krafträder' },
  { value: 'B', label: 'B - PKW bis 3,5t' },
  { value: 'BE', label: 'BE - PKW mit Anhänger' },
  { value: 'B96', label: 'B96 - PKW mit schwerem Anhänger' },
  { value: 'C1', label: 'C1 - LKW bis 7,5t' },
  { value: 'C1E', label: 'C1E - LKW bis 7,5t mit Anhänger' },
  { value: 'C', label: 'C - LKW über 3,5t' },
  { value: 'CE', label: 'CE - LKW mit Anhänger' },
  { value: 'D1', label: 'D1 - Kleinbusse' },
  { value: 'D1E', label: 'D1E - Kleinbusse mit Anhänger' },
  { value: 'D', label: 'D - Busse' },
  { value: 'DE', label: 'DE - Busse mit Anhänger' },
  { value: 'T', label: 'T - Land- und Forstwirtschaft' },
  { value: 'L', label: 'L - Zugmaschinen' },
];

export interface CompanyOption {
  id: string;
  name: string;
}

interface DriverFormFieldsProps {
  form: UseFormReturn<DriverFormData>;
  companies: CompanyOption[] | undefined;
}

/**
 * Karten "Persönliche Daten" und "Führerschein" für das Fahrer-Formular.
 */
export function DriverFormFields({ form, companies }: DriverFormFieldsProps): React.JSX.Element {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vorname *</FormLabel>
                <FormControl>
                  <Input placeholder="Max" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachname *</FormLabel>
                <FormControl>
                  <Input placeholder="Mustermann" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="max.mustermann@beispiel.de"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="+49 123 456789" {...field} value={field.value ?? ''} />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Firma auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Führerschein</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="license_class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Führerscheinklasse</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Klasse auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {licenseClasses.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Höchste Führerscheinklasse des Fahrers</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gültig bis</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormDescription>Ablaufdatum des Führerscheins</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
