'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { quickUvvCheckSchema, type QuickUvvCheckFormData } from '@/lib/validations/uvv-control';
import {
  useUvvSettings,
  useUvvInstructors,
  useDriversWithUvvStatus,
  useCreateBatchUvvChecks,
} from '@/hooks/use-uvv-control';
import { BatchCheckDriverSelect } from './batch-check-dialog-driver-select';
import { BatchCheckFields } from './batch-check-dialog-fields';

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

  const handleDateChange = (date: Date | undefined): void => {
    if (date) {
      form.setValue('check_date', format(date, 'yyyy-MM-dd'));
      form.setValue('next_check_due', format(calculateNextDue(date), 'yyyy-MM-dd'));
    }
  };

  const toggleDriver = (driverId: string): void => {
    setSelectedDriverIds((prev) =>
      prev.includes(driverId) ? prev.filter((id) => id !== driverId) : [...prev, driverId],
    );
  };

  const selectAllDrivers = (): void => {
    if (drivers) setSelectedDriverIds(drivers.map((d) => d.id));
  };

  const deselectAllDrivers = (): void => {
    setSelectedDriverIds([]);
  };

  const onSubmit = async (data: QuickUvvCheckFormData): Promise<void> => {
    if (selectedDriverIds.length === 0) {
      form.setError('root', { message: 'Bitte wähle mindestens einen Fahrer aus.' });
      return;
    }

    try {
      await createBatchMutation.mutateAsync({ driverIds: selectedDriverIds, checkData: data });
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <BatchCheckDriverSelect
                drivers={drivers}
                selectedDriverIds={selectedDriverIds}
                onToggleDriver={toggleDriver}
                onSelectAll={selectAllDrivers}
                onDeselectAll={deselectAllDrivers}
              />

              <BatchCheckFields
                form={form}
                instructors={instructors}
                intervalMonths={settings?.check_interval_months ?? 12}
                onCheckDateChange={handleDateChange}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive mt-4">{form.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading || selectedDriverIds.length === 0}>
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
