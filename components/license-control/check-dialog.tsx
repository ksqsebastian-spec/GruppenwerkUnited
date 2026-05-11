'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Upload, X, FileText, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  quickLicenseCheckSchema,
  type QuickLicenseCheckFormData,
} from '@/lib/validations/license-control';
import { calculateNextCheckDue } from '@/lib/database/license-control';
import {
  useLicenseInspectors,
  useLicenseSettings,
  useCreateLicenseCheck,
} from '@/hooks/use-license-control';
import { useUploadDocument, useDocumentTypes } from '@/hooks/use-documents';
import type { LicenseCheckEmployee } from '@/types';

interface CheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: LicenseCheckEmployee;
}

/**
 * Dialog für schnelle Führerscheinkontrolle mit optionalem Dokument-Upload
 */
export function CheckDialog({
  open,
  onOpenChange,
  employee,
}: CheckDialogProps): React.JSX.Element {
  const { data: inspectors = [] } = useLicenseInspectors('active');
  const { data: settings } = useLicenseSettings();
  const { data: documentTypes = [] } = useDocumentTypes();
  const createCheck = useCreateLicenseCheck();
  const uploadDocument = useUploadDocument();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Finde Dokumenttyp "Führerschein" oder nimm den ersten
  const licenseDocType = documentTypes.find(
    (t) => t.name.toLowerCase().includes('führerschein')
  ) || documentTypes[0];

  const form = useForm<QuickLicenseCheckFormData>({
    resolver: zodResolver(quickLicenseCheckSchema),
    defaultValues: {
      checked_by_id: '',
      license_verified: false,
      notes: '',
    },
  });

  // Formular und Datei zurücksetzen wenn Dialog geöffnet wird
  useEffect(() => {
    if (open) {
      form.reset({
        checked_by_id: '',
        license_verified: false,
        notes: '',
      });
      setSelectedFile(null);
    }
  }, [open, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      // Prüfe Dateigröße (max 10 MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
        return;
      }
      // Prüfe Dateityp
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = (): void => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data: QuickLicenseCheckFormData): Promise<void> => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const intervalMonths = settings?.check_interval_months ?? 6;
    const nextCheckDue = calculateNextCheckDue(today, intervalMonths);

    // 1. Kontrolle erstellen
    const newCheck = await createCheck.mutateAsync({
      employee_id: employee.id,
      check_date: today,
      checked_by_id: data.checked_by_id,
      license_verified: data.license_verified,
      next_check_due: nextCheckDue,
      notes: data.notes || null,
    });

    // 2. Falls Datei ausgewählt, Dokument hochladen
    if (selectedFile && newCheck?.id && licenseDocType?.id) {
      await uploadDocument.mutateAsync({
        entityType: 'license_check',
        entityId: newCheck.id,
        document_type_id: licenseDocType.id,
        name: `Führerschein ${employee.first_name} ${employee.last_name} - ${today}`,
        notes: `Kontrolle vom ${format(new Date(), 'dd.MM.yyyy')}`,
        file: selectedFile,
      });
    }

    onOpenChange(false);
  };

  const isSubmitting = createCheck.isPending || uploadDocument.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Führerscheinkontrolle durchführen</DialogTitle>
          <DialogDescription>
            Kontrolle für {employee.first_name} {employee.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="checked_by_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prüfer *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Prüfer auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          {inspector.name}
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
              name="license_verified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Führerschein im Original vorgelegt</FormLabel>
                    <FormDescription>
                      Bestätigt, dass der Führerschein physisch geprüft wurde
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Datei-Upload */}
            <div className="space-y-2">
              <FormLabel>Führerschein-Scan (optional)</FormLabel>
              {selectedFile ? (
                <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/50">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-500" />
                  )}
                  <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center gap-2 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Klicken zum Hochladen (PDF, JPG, PNG)
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optionale Anmerkungen zur Kontrolle..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground">
              Nächste Kontrolle: {settings?.check_interval_months ?? 6} Monate nach heute
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadDocument.isPending ? 'Hochladen...' : 'Speichern...'}
                  </>
                ) : (
                  'Kontrolle speichern'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
