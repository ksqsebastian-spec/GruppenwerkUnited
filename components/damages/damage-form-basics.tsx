'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
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
import type { DamageFormData } from '@/lib/validations/damage';
import type { DamageStatus } from '@/types';

const statusOptions: { value: DamageStatus; label: string }[] = [
  { value: 'reported', label: 'Gemeldet' },
  { value: 'approved', label: 'Genehmigt' },
  { value: 'in_repair', label: 'In Reparatur' },
  { value: 'completed', label: 'Abgeschlossen' },
];

export interface VehicleOption {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
}

export interface DriverOption {
  id: string;
  first_name: string;
  last_name: string;
}

export interface DamageTypeOption {
  id: string;
  name: string;
}

interface DamageFormBasicsProps {
  form: UseFormReturn<DamageFormData>;
  vehicles: VehicleOption[] | undefined;
  drivers: DriverOption[] | undefined;
  damageTypes: DamageTypeOption[] | undefined;
  isEditing: boolean;
}

/**
 * Karte mit den Grunddaten einer Schadensmeldung.
 */
export function DamageFormBasics({
  form,
  vehicles,
  drivers,
  damageTypes,
  isEditing,
}: DamageFormBasicsProps): React.JSX.Element {
  return (
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
  );
}
