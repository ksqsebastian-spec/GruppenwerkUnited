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
import { VehicleFormBasicSection } from './vehicle-form-basic-section';
import { VehicleFormLeasingSection } from './vehicle-form-leasing-section';
import { VehicleFormHolderSection } from './vehicle-form-holder-section';
import { VehicleFormInsuranceSection } from './vehicle-form-insurance-section';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useCompanies } from '@/hooks/use-companies';
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { vehicleSchema, type VehicleFormData } from '@/lib/validations/vehicle';
import type { Vehicle } from '@/types';

interface VehicleFormProps {
  /** Vorhandenes Fahrzeug zum Bearbeiten (optional) */
  vehicle?: Vehicle;
}

/**
 * Formular zum Erstellen und Bearbeiten von Fahrzeugen.
 * Strukturiert in Sub-Sektionen (Grunddaten, Leasing, Halter, Versicherung, Notizen),
 * jede in eigener Datei.
 */
export function VehicleForm({ vehicle }: VehicleFormProps): React.JSX.Element {
  const router = useRouter();
  const isEditing = !!vehicle;

  const { data: companies } = useCompanies();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      license_plate: vehicle?.license_plate ?? '',
      brand: vehicle?.brand ?? '',
      model: vehicle?.model ?? '',
      year: vehicle?.year ?? new Date().getFullYear(),
      vin: vehicle?.vin ?? '',
      fuel_type: vehicle?.fuel_type ?? 'diesel',
      purchase_date: vehicle?.purchase_date ?? '',
      purchase_price: vehicle?.purchase_price ?? undefined,
      mileage: vehicle?.mileage ?? 0,
      is_leased: vehicle?.is_leased ?? false,
      leasing_company: vehicle?.leasing_company ?? '',
      leasing_end_date: vehicle?.leasing_end_date ?? '',
      leasing_rate: vehicle?.leasing_rate ?? undefined,
      leasing_contract_number: vehicle?.leasing_contract_number ?? '',
      holder: vehicle?.holder ?? '',
      user_name: vehicle?.user_name ?? '',
      insurance_number: vehicle?.insurance_number ?? '',
      insurance_company: vehicle?.insurance_company ?? '',
      tuv_due_date: vehicle?.tuv_due_date ?? '',
      company_id: vehicle?.company_id ?? '',
      notes: vehicle?.notes ?? '',
    },
  });

  // Auto-Save-Hook: stellt nicht-gespeicherte Eingaben nach Reload wieder her.
  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `vehicle-form-${vehicle.id}` : 'vehicle-form-new',
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) {
        form.reset(data);
      }
    },
  });

  // Nach erfolgreichem Submit Auto-Save löschen.
  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      clearAutoSave();
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess, clearAutoSave]);

  const onSubmit = async (data: VehicleFormData): Promise<void> => {
    try {
      let vehicleId: string;

      if (isEditing) {
        await updateMutation.mutateAsync({ id: vehicle.id, data });
        vehicleId = vehicle.id;
      } else {
        const newVehicle = await createMutation.mutateAsync(data);
        vehicleId = newVehicle.id;
      }

      router.push(`/fuhrpark/vehicles/${vehicleId}`);
    } catch (error) {
      // Fehler wird bereits durch onError im Hook behandelt (Toast).
      console.error('Fehler beim Speichern des Fahrzeugs:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const noCompanies = !companies || companies.length === 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <VehicleFormBasicSection form={form} companies={companies} />
        <VehicleFormLeasingSection form={form} />
        <VehicleFormHolderSection form={form} />
        <VehicleFormInsuranceSection form={form} />

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
                      placeholder="Zusätzliche Informationen zum Fahrzeug..."
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
          <Button type="submit" disabled={isLoading || (!isEditing && noCompanies)}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Speichern' : 'Fahrzeug anlegen'}
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
