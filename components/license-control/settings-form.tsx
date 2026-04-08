'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';

import {
  licenseSettingsSchema,
  type LicenseSettingsFormData,
} from '@/lib/validations/license-control';
import {
  useLicenseSettings,
  useUpdateLicenseSettings,
} from '@/hooks/use-license-control';

/**
 * Formular für Führerscheinkontrolle-Einstellungen
 */
export function SettingsForm(): JSX.Element {
  const { data: settings, isLoading } = useLicenseSettings();
  const updateMutation = useUpdateLicenseSettings();

  const form = useForm<LicenseSettingsFormData>({
    resolver: zodResolver(licenseSettingsSchema),
    defaultValues: {
      check_interval_months: 6,
      warning_days_before: 14,
    },
  });

  // Formular mit geladenen Daten aktualisieren
  useEffect(() => {
    if (settings) {
      form.reset({
        check_interval_months: settings.check_interval_months,
        warning_days_before: settings.warning_days_before,
      });
    }
  }, [settings, form]);

  const handleSubmit = async (data: LicenseSettingsFormData): Promise<void> => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="check_interval_months"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kontroll-Intervall (Monate)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  className="w-32"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Wie oft sollen Führerscheine kontrolliert werden? (Standard: 6 Monate)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warning_days_before"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warnung vor Fälligkeit (Tage)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  className="w-32"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Wie viele Tage vorher soll eine Warnung angezeigt werden? (Standard: 14 Tage)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern...
            </>
          ) : (
            'Einstellungen speichern'
          )}
        </Button>
      </form>
    </Form>
  );
}
