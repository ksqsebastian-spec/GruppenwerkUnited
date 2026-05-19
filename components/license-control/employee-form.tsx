'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import type { LicenseCheckEmployee } from '@/types';
import { EmployeeFormFields } from './employee-form-fields';

interface EmployeeFormProps {
  /** Bestehender Mitarbeiter (für Bearbeitung) */
  employee?: LicenseCheckEmployee;
}

/**
 * Formular für Führerscheinkontrolle-Mitarbeiter
 */
export function EmployeeForm({ employee }: EmployeeFormProps): React.JSX.Element {
  const router = useRouter();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateLicenseEmployee();
  const updateMutation = useUpdateLicenseEmployee();

  const isEditing = !!employee;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const autoSaveKey = isEditing ? `license-employee-edit-${employee.id}` : 'license-employee-new';

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

  const { clear: clearAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) form.reset(data);
    },
  });

  const handleSubmit = async (data: LicenseEmployeeFormData): Promise<void> => {
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
    router.push('/fuhrpark/license-control/employees');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EmployeeFormFields form={form} companies={companies} />

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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/fuhrpark/license-control/employees')}
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
