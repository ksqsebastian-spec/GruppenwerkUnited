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
import type { LicenseEmployeeFormData } from '@/lib/validations/license-control';

export interface CompanyOption {
  id: string;
  name: string;
}

interface EmployeeFormFieldsProps {
  form: UseFormReturn<LicenseEmployeeFormData>;
  companies: CompanyOption[];
}

/**
 * Persönliche und Führerschein-Daten für einen Führerscheinkontrolle-Mitarbeiter.
 */
export function EmployeeFormFields({ form, companies }: EmployeeFormFieldsProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Persönliche Daten</h3>
        <div className="grid gap-4 md:grid-cols-2">
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
            name="personnel_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personalnummer</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} value={field.value ?? ''} />
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
                    {companies.map((company) => (
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

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="max.mustermann@firma.de"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Führerschein-Daten</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="license_classes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Führerscheinklassen *</FormLabel>
                <FormControl>
                  <Input placeholder="B, BE, C1" {...field} />
                </FormControl>
                <FormDescription>Kommagetrennt, z.B. &quot;B, BE, C1&quot;</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Führerscheinnummer</FormLabel>
                <FormControl>
                  <Input placeholder="B072..." {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Führerschein gültig bis</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormDescription>
                  Ablaufdatum des Führerscheins selbst (nicht der Kontrolle)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );
}
