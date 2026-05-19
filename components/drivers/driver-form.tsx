'use client';

import { useEffect } from 'react';
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
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useCompanies } from '@/hooks/use-companies';
import { useCreateDriver, useUpdateDriver } from '@/hooks/use-drivers';
import { driverSchema, type DriverFormData } from '@/lib/validations/driver';
import type { Driver } from '@/types';
import { DriverFormFields } from './driver-form-fields';

interface DriverFormProps {
  /** Vorhandener Fahrer zum Bearbeiten (optional) */
  driver?: Driver;
}

/**
 * Formular zum Erstellen und Bearbeiten von Fahrern
 */
export function DriverForm({ driver }: DriverFormProps): React.JSX.Element {
  const router = useRouter();
  const isEditing = !!driver;

  const { data: companies } = useCompanies();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      first_name: driver?.first_name ?? '',
      last_name: driver?.last_name ?? '',
      email: driver?.email ?? '',
      phone: driver?.phone ?? '',
      license_class: driver?.license_class ?? '',
      license_expiry: driver?.license_expiry ?? '',
      company_id: driver?.company_id ?? '',
      notes: driver?.notes ?? '',
    },
  });

  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `driver-form-${driver.id}` : 'driver-form-new',
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) form.reset(data);
    },
  });

  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) clearAutoSave();
  }, [createMutation.isSuccess, updateMutation.isSuccess, clearAutoSave]);

  const onSubmit = async (data: DriverFormData): Promise<void> => {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: driver.id, data });
      router.push(`/fuhrpark/drivers/${driver.id}`);
    } else {
      const newDriver = await createMutation.mutateAsync(data);
      router.push(`/fuhrpark/drivers/${newDriver.id}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DriverFormFields form={form} companies={companies} />

        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Zusätzliche Informationen zum Fahrer..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Speichern' : 'Fahrer anlegen'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
}
