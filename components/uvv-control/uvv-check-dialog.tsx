'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { uvvCheckSchema, type UvvCheckFormData } from '@/lib/validations/uvv-control';
import { useUvvSettings, useUvvInstructors, useCreateUvvCheck } from '@/hooks/use-uvv-control';
import { useUploadDocument } from '@/hooks/use-documents';
import { GeneratePdfButton } from './generate-pdf-button';
import { UvvCheckDialogFields } from './uvv-check-dialog-fields';
import { UvvCheckDialogFileUpload } from './uvv-check-dialog-file-upload';
import type { DriverWithUvvStatus } from '@/types';

interface UvvCheckDialogProps {
  /** Der Fahrer für den die Unterweisung durchgeführt wird */
  driver: DriverWithUvvStatus;
  /** Ob der Dialog geöffnet ist */
  open: boolean;
  /** Callback wenn sich der Öffnungszustand ändert */
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog zum Durchführen einer UVV-Unterweisung
 */
export function UvvCheckDialog({ driver, open, onOpenChange }: UvvCheckDialogProps): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: settings } = useUvvSettings();
  const { data: instructors } = useUvvInstructors('active');
  const createCheckMutation = useCreateUvvCheck();
  const uploadDocumentMutation = useUploadDocument();

  // Nächstes Fälligkeitsdatum berechnen (basierend auf Einstellungen)
  const calculateNextDue = (checkDate: Date): Date => {
    const months = settings?.check_interval_months ?? 12;
    const nextDue = new Date(checkDate);
    nextDue.setMonth(nextDue.getMonth() + months);
    return nextDue;
  };

  const form = useForm<UvvCheckFormData>({
    resolver: zodResolver(uvvCheckSchema),
    defaultValues: {
      driver_id: driver.id,
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

  const handleFileValidationError = (message: string): void => {
    form.setError('root', { message });
  };

  const handleFileSelected = (file: File | null): void => {
    setSelectedFile(file);
    if (file) form.clearErrors('root');
  };

  const onSubmit = async (data: UvvCheckFormData): Promise<void> => {
    try {
      // 1. Unterweisung speichern
      const check = await createCheckMutation.mutateAsync(data);

      // 2. Falls Dokument vorhanden, hochladen
      if (selectedFile) {
        await uploadDocumentMutation.mutateAsync({
          entityType: 'uvv_check',
          entityId: check.id,
          file: selectedFile,
          document_type_id: '',
          name: selectedFile.name,
          notes: `Unterweisungsnachweis vom ${format(new Date(data.check_date), 'dd.MM.yyyy', { locale: de })}`,
        });
      }

      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      console.error('Fehler beim Speichern der Unterweisung:', error);
    }
  };

  const isLoading = createCheckMutation.isPending || uploadDocumentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>UVV-Unterweisung durchführen</DialogTitle>
          <DialogDescription>
            Unterweisung für {driver.first_name} {driver.last_name} dokumentieren
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <UvvCheckDialogFields
              form={form}
              instructors={instructors}
              intervalMonths={settings?.check_interval_months ?? 12}
              onCheckDateChange={handleDateChange}
            />

            {/* PDF generieren */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Unterweisungsnachweis</h4>
              <p className="text-sm text-muted-foreground">
                Generiere ein PDF zum Ausdrucken und Unterschreiben. Nach der Unterschrift kann das eingescannte
                Dokument hier hochgeladen werden.
              </p>
              <GeneratePdfButton driver={driver} variant="outline" className="w-full" />
            </div>

            <UvvCheckDialogFileUpload
              selectedFile={selectedFile}
              onFileSelected={handleFileSelected}
              onValidationError={handleFileValidationError}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  'Unterweisung speichern'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
