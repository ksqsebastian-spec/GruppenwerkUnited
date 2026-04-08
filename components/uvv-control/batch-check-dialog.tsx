'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { quickUvvCheckSchema, type QuickUvvCheckFormData } from '@/lib/validations/uvv-control';
import {
  useUvvSettings,
  useUvvInstructors,
  useDriversWithUvvStatus,
  useCreateBatchUvvChecks,
} from '@/hooks/use-uvv-control';
import type { DriverWithUvvStatus } from '@/types';

interface BatchCheckDialogProps {
  /** Ob der Dialog geöffnet ist */
  open: boolean;
  /** Callback wenn sich der Öffnungszustand ändert */
  onOpenChange: (open: boolean) => void;
  /** Vorausgewählte Fahrer-IDs (optional) */
  preselectedDriverIds?: string[];
}

/**
 * Dialog für Sammel-Unterweisung mehrerer Fahrer
 */
export function BatchCheckDialog({
  open,
  onOpenChange,
  preselectedDriverIds = [],
}: BatchCheckDialogProps): React.JSX.Element {
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>(preselectedDriverIds);

  const { data: settings } = useUvvSettings();
  const { data: instructors } = useUvvInstructors('active');
  const { data: drivers } = useDriversWithUvvStatus({ status: 'active' });
  const createBatchMutation = useCreateBatchUvvChecks();

  // Nächstes Fälligkeitsdatum berechnen
  const calculateNextDue = (checkDate: Date): Date => {
    const months = settings?.check_interval_months ?? 12;
    const nextDue = new Date(checkDate);
    nextDue.setMonth(nextDue.getMonth() + months);
    return nextDue;
  };

  const form = useForm<QuickUvvCheckFormData>({
    resolver: zodResolver(quickUvvCheckSchema),
    defaultValues: {
      check_date: format(new Date(), 'yyyy-MM-dd'),
      instructed_by_id: '',
      topics: settings?.default_topics ?? '',
      next_check_due: format(calculateNextDue(new Date()), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  // Bei Datumsänderung nächstes Fälligkeitsdatum aktualisieren
  const handleDateChange = (date: Date | undefined): void => {
    if (date) {
      form.setValue('check_date', format(date, 'yyyy-MM-dd'));
      form.setValue('next_check_due', format(calculateNextDue(date), 'yyyy-MM-dd'));
    }
  };

  const toggleDriver = (driverId: string): void => {
    setSelectedDriverIds((prev) =>
      prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId]
    );
  };

  const selectAllDrivers = (): void => {
    if (drivers) {
      setSelectedDriverIds(drivers.map((d) => d.id));
    }
  };

  const deselectAllDrivers = (): void => {
    setSelectedDriverIds([]);
  };

  const onSubmit = async (data: QuickUvvCheckFormData): Promise<void> => {
    if (selectedDriverIds.length === 0) {
      form.setError('root', {
        message: 'Bitte wähle mindestens einen Fahrer aus.',
      });
      return;
    }

    try {
      await createBatchMutation.mutateAsync({
        driverIds: selectedDriverIds,
        checkData: data,
      });

      // Dialog schließen
      onOpenChange(false);
      form.reset();
      setSelectedDriverIds([]);
    } catch (error) {
      console.error('Fehler bei Sammel-Unterweisung:', error);
    }
  };

  const isLoading = createBatchMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sammel-Unterweisung
          </DialogTitle>
          <DialogDescription>
            Unterweisung für mehrere Fahrer gleichzeitig dokumentieren
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Fahrer-Auswahl */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Fahrer auswählen *</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllDrivers}
                    >
                      Alle auswählen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAllDrivers}
                    >
                      Keine auswählen
                    </Button>
                  </div>
                </div>
                <div className="h-[200px] rounded-md border p-4 overflow-y-auto">
                  <div className="space-y-2">
                    {drivers?.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`driver-${driver.id}`}
                          checked={selectedDriverIds.includes(driver.id)}
                          onCheckedChange={() => toggleDriver(driver.id)}
                        />
                        <label
                          htmlFor={`driver-${driver.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {driver.first_name} {driver.last_name}
                          {driver.company && (
                            <span className="text-muted-foreground ml-2">
                              ({driver.company.name})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedDriverIds.length} Fahrer ausgewählt
                </p>
              </div>

              {/* Datum der Unterweisung */}
              <FormField
                control={form.control}
                name="check_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum der Unterweisung *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'dd.MM.yyyy', { locale: de })
                            ) : (
                              <span>Datum wählen</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={handleDateChange}
                          disabled={(date) => date > new Date()}
                          locale={de}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unterweisender */}
              <FormField
                control={form.control}
                name="instructed_by_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unterweisender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unterweisenden auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {instructors?.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Themen */}
              <FormField
                control={form.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Themen</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Behandelte Themen der Unterweisung..."
                        className="min-h-[80px]"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nächste Fälligkeit */}
              <FormField
                control={form.control}
                name="next_check_due"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Nächste Unterweisung fällig am *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'dd.MM.yyyy', { locale: de })
                            ) : (
                              <span>Datum wählen</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            date && field.onChange(format(date, 'yyyy-MM-dd'))
                          }
                          disabled={(date) => date < new Date()}
                          locale={de}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Gilt für alle ausgewählten Fahrer (
                      {settings?.check_interval_months ?? 12} Monate nach Unterweisung)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notizen */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optionale Anmerkungen..."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fehlermeldung */}
            {form.formState.errors.root && (
              <p className="text-sm text-destructive mt-4">
                {form.formState.errors.root.message}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isLoading || selectedDriverIds.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  `${selectedDriverIds.length} Fahrer unterweisen`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
