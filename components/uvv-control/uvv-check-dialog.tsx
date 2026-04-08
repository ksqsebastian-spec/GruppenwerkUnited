'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Upload, X, FileText, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import { uvvCheckSchema, type UvvCheckFormData } from '@/lib/validations/uvv-control';
import { useUvvSettings, useUvvInstructors, useCreateUvvCheck } from '@/hooks/use-uvv-control';
import { useUploadDocument } from '@/hooks/use-documents';
import { GeneratePdfButton } from './generate-pdf-button';
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
export function UvvCheckDialog({
  driver,
  open,
  onOpenChange,
}: UvvCheckDialogProps): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      // Prüfe Dateityp und Größe
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        form.setError('root', {
          message: 'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        form.setError('root', {
          message: 'Die Datei ist zu groß. Maximal 10 MB erlaubt.',
        });
        return;
      }
      setSelectedFile(file);
      form.clearErrors('root');
    }
  };

  const handleRemoveFile = (): void => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          document_type_id: '', // Allgemeiner Dokumenttyp
          name: selectedFile.name,
          notes: `Unterweisungsnachweis vom ${format(new Date(data.check_date), 'dd.MM.yyyy', { locale: de })}`,
        });
      }

      // Dialog schließen
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      // Fehler wird vom Hook behandelt (Toast)
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
                  <FormDescription>
                    Person, die die Unterweisung durchgeführt hat
                  </FormDescription>
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
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Themen, die in der Unterweisung behandelt wurden
                  </FormDescription>
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
                    Wird automatisch berechnet (
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

            {/* PDF generieren */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Unterweisungsnachweis</h4>
              <p className="text-sm text-muted-foreground">
                Generiere ein PDF zum Ausdrucken und Unterschreiben. Nach der
                Unterschrift kann das eingescannte Dokument hier hochgeladen werden.
              </p>
              <GeneratePdfButton driver={driver} variant="outline" className="w-full" />
            </div>

            {/* Dokument hochladen */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Unterschriebenes Dokument hochladen</h4>
              <p className="text-sm text-muted-foreground">
                Lade das unterschriebene und eingescannte Dokument hoch (optional).
              </p>

              {selectedFile ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="uvv-document-upload"
                  />
                  <label htmlFor="uvv-document-upload">
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Dokument auswählen
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {/* Fehlermeldung */}
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
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
