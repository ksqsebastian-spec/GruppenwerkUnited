'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
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

import {
  licenseEmployeeSchema,
  type LicenseEmployeeFormData,
} from '@/lib/validations/license-control';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useCompanies } from '@/hooks/use-companies';
import {
  useCreateLicenseEmployee,
  useUpdateLicenseEmployee,
} from '@/hooks/use-license-control';
import { LICENSE_CLASSES } from '@/lib/constants';
import type { LicenseCheckEmployee } from '@/types';

interface EmployeeFormProps {
  /** Bestehender Mitarbeiter (für Bearbeitung) */
  employee?: LicenseCheckEmployee;
}

/**
 * Formular für Führerscheinkontrolle-Mitarbeiter
 */
export function EmployeeForm({ employee }: EmployeeFormProps): JSX.Element {
  const router = useRouter();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateLicenseEmployee();
  const updateMutation = useUpdateLicenseEmployee();

  const isEditing = !!employee;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const autoSaveKey = isEditing
    ? `license-employee-edit-${employee.id}`
    : 'license-employee-new';

  const form = useForm<LicenseEmployeeFormData>({
    resolver: zodResolver(licenseEmployeeSchema),
    defaultValues: {
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      personnel_number: employee?.personnel_number ?? '',
      company_id: employee?.company_id ?? '',
      email: employee?.email ?? '',
      license_classes: employee?.license_classes ?? '',
      license_number: employee?.license_number ?? '',
      license_expiry_date: employee?.license_expiry_date ?? '',
      status: employee?.status ?? 'active',
      notes: employee?.notes ?? '',
    },
  });

  // Auto-Save aktivieren
  const { clear: clearAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) {
        form.reset(data);
      }
    },
  });

  const handleSubmit = async (data: LicenseEmployeeFormData): Promise<void> => {
    // Konvertiere leere Strings zu null für die Datenbank
    const insertData = {
      first_name: data.first_name,
      last_name: data.last_name,
      personnel_number: data.personnel_number || null,
      company_id: data.company_id,
      email: data.email || null,
      license_classes: data.license_classes,
      license_number: data.license_number || null,
      license_expiry_date: data.license_expiry_date || null,
      status: data.status,
      notes: data.notes || null,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id: employee.id, data: insertData });
    } else {
      await createMutation.mutateAsync(insertData);
    }
    clearAutoSave();
    router.push('/license-control/employees');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Persönliche Daten */}
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

        {/* Führerschein-Daten */}
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
                  <FormDescription>
                    Kommagetrennt, z.B. &quot;B, BE, C1&quot;
                  </FormDescription>
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

        {/* Notizen */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notizen</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Zusätzliche Informationen..."
                  className="min-h-24"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/license-control/employees')}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : isEditing ? (
              'Änderungen speichern'
            ) : (
              'Mitarbeiter anlegen'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
