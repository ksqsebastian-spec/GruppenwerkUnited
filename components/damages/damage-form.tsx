'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useCreateDamage, useUpdateDamage, useDamageTypes } from '@/hooks/use-damages';
import { damageSchema, type DamageFormData } from '@/lib/validations/damage';
import type { Damage } from '@/types';
import { DamageFormBasics } from './damage-form-basics';
import { DamageFormCostsInsurance } from './damage-form-costs-insurance';

interface DamageFormProps {
  /** Vorhandener Schaden zum Bearbeiten (optional) */
  damage?: Damage;
}

/**
 * Formular zum Erstellen und Bearbeiten von Schäden
 */
export function DamageForm({ damage }: DamageFormProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = !!damage;

  const preselectedVehicleId = searchParams.get('vehicleId');

  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: drivers } = useDrivers({ status: 'active' });
  const { data: damageTypes } = useDamageTypes();
  const createMutation = useCreateDamage();
  const updateMutation = useUpdateDamage();

  const form = useForm<DamageFormData>({
    resolver: zodResolver(damageSchema),
    defaultValues: {
      vehicle_id: damage?.vehicle_id ?? preselectedVehicleId ?? '',
      damage_type_id: damage?.damage_type_id ?? '',
      date: damage?.date ?? new Date().toISOString().split('T')[0],
      description: damage?.description ?? '',
      location: damage?.location ?? '',
      cost_estimate: damage?.cost_estimate ?? undefined,
      actual_cost: damage?.actual_cost ?? undefined,
      insurance_claim: damage?.insurance_claim ?? false,
      insurance_claim_number: damage?.insurance_claim_number ?? '',
      status: damage?.status ?? 'reported',
      reported_by: damage?.reported_by ?? '',
      notes: damage?.notes ?? '',
    },
  });

  const watchInsuranceClaim = form.watch('insurance_claim');

  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `damage-form-${damage.id}` : 'damage-form-new',
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) form.reset(data);
    },
  });

  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) clearAutoSave();
  }, [createMutation.isSuccess, updateMutation.isSuccess, clearAutoSave]);

  const onSubmit = async (data: DamageFormData): Promise<void> => {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: damage.id, data });
      router.push(`/fuhrpark/damages/${damage.id}`);
    } else {
      const newDamage = await createMutation.mutateAsync(data);
      router.push(`/fuhrpark/damages/${newDamage.id}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DamageFormBasics
          form={form}
          vehicles={vehicles}
          drivers={drivers}
          damageTypes={damageTypes}
          isEditing={isEditing}
        />

        <DamageFormCostsInsurance form={form} insuranceClaim={watchInsuranceClaim} />

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
                      placeholder="Zusätzliche Informationen..."
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
            {isEditing ? 'Speichern' : 'Schaden melden'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
}
