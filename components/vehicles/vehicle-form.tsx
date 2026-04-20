'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useCompanies } from '@/hooks/use-companies';
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { useFuhrparkCompanyId } from '@/hooks/use-fuhrpark-company';
import { useAuth } from '@/components/providers/auth-provider';
import { syncLeasingAppointment, syncLeasingCost } from '@/lib/database/vehicles';
import { vehicleSchema, type VehicleFormData } from '@/lib/validations/vehicle';
import type { Vehicle } from '@/types';

interface VehicleFormProps {
  /** Vorhandenes Fahrzeug zum Bearbeiten (optional) */
  vehicle?: Vehicle;
}

/**
 * Kraftstofftypen für das Auswahlfeld
 */
const fuelTypes = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'benzin', label: 'Benzin' },
  { value: 'elektro', label: 'Elektro' },
  { value: 'hybrid_benzin', label: 'Hybrid (Benzin)' },
  { value: 'hybrid_diesel', label: 'Hybrid (Diesel)' },
  { value: 'gas', label: 'Gas' },
];

/**
 * Formular zum Erstellen und Bearbeiten von Fahrzeugen
 */
export function VehicleForm({ vehicle }: VehicleFormProps): React.JSX.Element {
  const router = useRouter();
  const isEditing = !!vehicle;

  const { company } = useAuth();
  const { companyId: fuhrparkCompanyId } = useFuhrparkCompanyId();
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
      // Leasing-Felder
      leasing_company: vehicle?.leasing_company ?? '',
      leasing_end_date: vehicle?.leasing_end_date ?? '',
      leasing_rate: vehicle?.leasing_rate ?? undefined,
      leasing_contract_number: vehicle?.leasing_contract_number ?? '',
      // Halter & Nutzer
      holder: vehicle?.holder ?? '',
      user_name: vehicle?.user_name ?? '',
      insurance_number: vehicle?.insurance_number ?? '',
      insurance_company: vehicle?.insurance_company ?? '',
      tuv_due_date: vehicle?.tuv_due_date ?? '',
      company_id: vehicle?.company_id ?? '',
      notes: vehicle?.notes ?? '',
    },
  });

  // Auto-Save Hook
  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `vehicle-form-${vehicle.id}` : 'vehicle-form-new',
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) {
        form.reset(data);
      }
    },
  });

  // Firmen-ID für Nicht-Admins automatisch setzen
  useEffect(() => {
    if (fuhrparkCompanyId && !company?.isAdmin && !isEditing) {
      form.setValue('company_id', fuhrparkCompanyId);
    }
  }, [fuhrparkCompanyId, company?.isAdmin, isEditing, form]);

  // Bei erfolgreichem Submit Auto-Save löschen
  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      clearAutoSave();
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess, clearAutoSave]);

  const onSubmit = async (data: VehicleFormData): Promise<void> => {
    try {
      let vehicleId: string;

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: vehicle.id,
          data,
        });
        vehicleId = vehicle.id;
      } else {
        const newVehicle = await createMutation.mutateAsync(data);
        vehicleId = newVehicle.id;
      }

      // Leasing-Rückgabe-Termin synchronisieren
      await syncLeasingAppointment(
        vehicleId,
        data.leasing_end_date ?? null,
        data.is_leased ?? false
      );

      // Leasing-Kosten für aktuellen Monat erstellen
      await syncLeasingCost(
        vehicleId,
        data.leasing_rate,
        data.is_leased ?? false
      );

      router.push(`/fuhrpark/vehicles/${vehicleId}`);
    } catch (error) {
      // Fehler wird bereits durch onError im Hook behandelt (Toast)
      console.error('Fehler beim Speichern des Fahrzeugs:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending ||
    (!company?.isAdmin && !fuhrparkCompanyId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Grunddaten */}
        <Card>
          <CardHeader>
            <CardTitle>Grunddaten</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="license_plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kennzeichen *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. HH-AB 1234" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {company?.isAdmin && (
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma *</FormLabel>
                  {(!companies || companies.length === 0) ? (
                    <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                      Keine Firmen vorhanden.{' '}
                      <a href="/fuhrpark/settings" className="text-primary underline hover:no-underline">
                        Bitte zuerst eine Firma anlegen.
                      </a>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Firma auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((co) => (
                          <SelectItem key={co.id} value={co.id}>
                            {co.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marke *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Mercedes" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modell *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Sprinter" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baujahr *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1990}
                      max={new Date().getFullYear() + 1}
                      {...field} value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fuel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kraftstoff *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kraftstoff auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fuelTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fahrgestellnummer (VIN)</FormLabel>
                  <FormControl>
                    <Input placeholder="17-stellige VIN" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Eindeutige Fahrzeug-Identifikationsnummer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometerstand</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field} value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Kauf/Leasing */}
        <Card>
          <CardHeader>
            <CardTitle>Kauf / Leasing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kaufdatum</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kaufpreis</FormLabel>
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
              name="is_leased"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Leasingfahrzeug</FormLabel>
                    <FormDescription>
                      Aktivieren wenn das Fahrzeug geleast ist
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Bedingte Leasing-Felder */}
            {form.watch('is_leased') && (
              <>
                <FormField
                  control={form.control}
                  name="leasing_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leasinggeber</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. ALD Automotive" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leasing_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leasingende</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>
                        Ein Rückgabe-Termin wird automatisch erstellt
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leasing_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monatliche Rate</FormLabel>
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
                  name="leasing_contract_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vertragsnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="Leasing-Vertragsnummer" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Halter & Nutzer */}
        <Card>
          <CardHeader>
            <CardTitle>Halter & Nutzer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="holder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fahrzeughalter</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Max Mustermann GmbH" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Eingetragener Besitzer des Fahrzeugs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hauptnutzer</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Hans Müller" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Person die das Fahrzeug hauptsächlich nutzt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Versicherung & TÜV */}
        <Card>
          <CardHeader>
            <CardTitle>Versicherung & TÜV</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="insurance_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versicherung</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Allianz" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insurance_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versicherungsnummer</FormLabel>
                  <FormControl>
                    <Input placeholder="Vertragsnummer" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tuv_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TÜV fällig</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Nächster TÜV-Termin
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
                      placeholder="Zusätzliche Informationen zum Fahrzeug..."
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
          <Button type="submit" disabled={isLoading || (!isEditing && (!companies || companies.length === 0))}>
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
