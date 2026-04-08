'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useCreateDamage, useUpdateDamage, useDamageTypes } from '@/hooks/use-damages';
import { damageSchema, type DamageFormData } from '@/lib/validations/damage';
import type { Damage, DamageStatus } from '@/types';

interface DamageFormProps {
  /** Vorhandener Schaden zum Bearbeiten (optional) */
  damage?: Damage;
}

/**
 * Status-Optionen
 */
const statusOptions: { value: DamageStatus; label: string }[] = [
  { value: 'reported', label: 'Gemeldet' },
  { value: 'approved', label: 'Genehmigt' },
  { value: 'in_repair', label: 'In Reparatur' },
  { value: 'completed', label: 'Abgeschlossen' },
];

/**
 * Formular zum Erstellen und Bearbeiten von Schäden
 */
export function DamageForm({ damage }: DamageFormProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = !!damage;

  // Vorauswahl des Fahrzeugs aus URL-Parameter
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

  // Beobachte insurance_claim für bedingte Felder
  const watchInsuranceClaim = form.watch('insurance_claim');

  // Auto-Save Hook
  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `damage-form-${damage.id}` : 'damage-form-new',
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

  const onSubmit = async (data: DamageFormData): Promise<void> => {
    if (isEditing) {
      await updateMutation.mutateAsync({
        id: damage.id,
        data,
      });
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
        {/* Grunddaten */}
        <Card>
          <CardHeader>
            <CardTitle>Schadensmeldung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fahrzeug *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Fahrzeug auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
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
              name="damage_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schadensart *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Schadensart auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {damageTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schadensdatum *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schadensort</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Parkplatz Hauptstraße" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reported_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gemeldet von *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Fahrer auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers?.map((driver) => (
                        <SelectItem key={driver.id} value={`${driver.first_name} ${driver.last_name}`}>
                          {driver.first_name} {driver.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Beschreibung *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreibe den Schaden detailliert..."
                      className="min-h-[100px]"
                      {...field} value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Kosten */}
        <Card>
          <CardHeader>
            <CardTitle>Kosten</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cost_estimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geschätzte Kosten</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0,00"
                      suffix="€"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actual_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tatsächliche Kosten</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0,00"
                      suffix="€"
                    />
                  </FormControl>
                  <FormDescription>
                    Nach Reparatur ausfüllen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Versicherung */}
        <Card>
          <CardHeader>
            <CardTitle>Versicherung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="insurance_claim"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Versicherungsfall</FormLabel>
                    <FormDescription>
                      Wird dieser Schaden über die Versicherung abgewickelt?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchInsuranceClaim && (
              <FormField
                control={form.control}
                name="insurance_claim_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schadensnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Versicherungs-Schadensnummer" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                      placeholder="Zusätzliche Informationen..."
                      className="min-h-[100px]"
                      {...field} value={field.value ?? ''}
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
            {isEditing ? 'Speichern' : 'Schaden melden'}
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
