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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useCompanies } from '@/hooks/use-companies';
import { useCreateDriver, useUpdateDriver } from '@/hooks/use-drivers';
import { driverSchema, type DriverFormData } from '@/lib/validations/driver';
import type { Driver } from '@/types';

interface DriverFormProps {
  /** Vorhandener Fahrer zum Bearbeiten (optional) */
  driver?: Driver;
}

/**
 * Führerscheinklassen
 */
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

/**
 * Formular zum Erstellen und Bearbeiten von Fahrern
 */
export function DriverForm({ driver }: DriverFormProps): JSX.Element {
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

  // Auto-Save Hook
  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `driver-form-${driver.id}` : 'driver-form-new',
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) {
        form.reset(data);
      }
    },
  });

  // Bei erfolgreichem Submit Auto-Save löschen
  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      clearAutoSave();
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess, clearAutoSave]);

  const onSubmit = async (data: DriverFormData): Promise<void> => {
    if (isEditing) {
      await updateMutation.mutateAsync({
        id: driver.id,
        data,
      });
      router.push(`/drivers/${driver.id}`);
    } else {
      const newDriver = await createMutation.mutateAsync(data);
      router.push(`/drivers/${newDriver.id}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Persönliche Daten */}
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

        {/* Führerschein */}
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
                  <FormDescription>
                    Höchste Führerscheinklasse des Fahrers
                  </FormDescription>
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
                  <FormDescription>
                    Ablaufdatum des Führerscheins
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notizen */}
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

        {/* Aktionen */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Speichern' : 'Fahrer anlegen'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
}
