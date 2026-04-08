'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useVehicles } from '@/hooks/use-vehicles';
import { useCreateAppointment, useUpdateAppointment, useAppointmentTypes } from '@/hooks/use-appointments';
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations/appointment';
import type { Appointment } from '@/types';

interface AppointmentFormProps {
  /** Vorhandener Termin zum Bearbeiten (optional) */
  appointment?: Appointment;
}

/**
 * Formular zum Erstellen und Bearbeiten von Terminen
 */
export function AppointmentForm({ appointment }: AppointmentFormProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = !!appointment;

  // Vorauswahl des Fahrzeugs aus URL-Parameter
  const preselectedVehicleId = searchParams.get('vehicleId');

  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: appointmentTypes } = useAppointmentTypes();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      vehicle_id: appointment?.vehicle_id ?? preselectedVehicleId ?? '',
      appointment_type_id: appointment?.appointment_type_id ?? '',
      due_date: appointment?.due_date ?? '',
      notes: appointment?.notes ?? '',
    },
  });

  // Auto-Save Hook
  const { clear: clearAutoSave } = useAutoSave({
    key: isEditing ? `appointment-form-${appointment.id}` : 'appointment-form-new',
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

  const onSubmit = async (data: AppointmentFormData): Promise<void> => {
    if (isEditing) {
      await updateMutation.mutateAsync({
        id: appointment.id,
        data,
      });
      router.push('/fuhrpark/appointments');
    } else {
      await createMutation.mutateAsync({
        ...data,
        status: 'pending',
      });
      router.push('/fuhrpark/appointments');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Termin-Details</CardTitle>
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
              name="appointment_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terminart *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Terminart auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                          {type.default_interval_months && (
                            <span className="text-muted-foreground ml-2">
                              (alle {type.default_interval_months} Monate)
                            </span>
                          )}
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
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fälligkeitsdatum *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Wann der Termin fällig ist
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
                      placeholder="Zusätzliche Informationen zum Termin..."
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
            {isEditing ? 'Speichern' : 'Termin anlegen'}
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
