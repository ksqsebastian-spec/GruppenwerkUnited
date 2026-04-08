'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
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
import { useDocumentTypes, useUploadDocument } from '@/hooks/use-documents';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useDamages } from '@/hooks/use-damages';
import { useAppointments } from '@/hooks/use-appointments';
import type { DocumentEntityType } from '@/types';

/** Erlaubte Dateitypen */
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Entity-Typ Optionen */
const entityTypeOptions: { value: DocumentEntityType; label: string }[] = [
  { value: 'vehicle', label: 'Fahrzeug' },
  { value: 'damage', label: 'Schaden' },
  { value: 'appointment', label: 'Termin' },
  { value: 'driver', label: 'Fahrer' },
];

/** Formular-Schema */
const uploadSchema = z.object({
  entityType: z.enum(['vehicle', 'damage', 'appointment', 'driver'], {
    required_error: 'Bitte wähle eine Herkunft',
  }),
  entityId: z.string().min(1, 'Bitte wähle einen Eintrag'),
  documentTypeId: z.string().min(1, 'Bitte wähle einen Dokumenttyp'),
  name: z.string().min(1, 'Bitte gib einen Namen ein'),
  notes: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface DocumentUploadDialogProps {
  /** Trigger-Button (optional, Standard ist Plus-Button) */
  trigger?: React.ReactNode;
}

/**
 * Dialog zum Hochladen eines neuen Dokuments mit Entity-Auswahl
 */
export function DocumentUploadDialog({ trigger }: DocumentUploadDialogProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documentTypes } = useDocumentTypes();
  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: drivers } = useDrivers({ status: 'active' });
  const { data: damages } = useDamages();
  const { data: appointments } = useAppointments();
  const uploadMutation = useUploadDocument();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      entityType: undefined,
      entityId: '',
      documentTypeId: '',
      name: '',
      notes: '',
    },
  });

  const selectedEntityType = form.watch('entityType');

  /**
   * Gibt die Entity-Optionen basierend auf dem ausgewählten Typ zurück
   */
  const getEntityOptions = (): { value: string; label: string }[] => {
    switch (selectedEntityType) {
      case 'vehicle':
        return (
          vehicles?.map((v) => ({
            value: v.id,
            label: `${v.license_plate} - ${v.brand} ${v.model}`,
          })) ?? []
        );
      case 'driver':
        return (
          drivers?.map((d) => ({
            value: d.id,
            label: `${d.first_name} ${d.last_name}`,
          })) ?? []
        );
      case 'damage':
        return (
          damages?.map((d) => ({
            value: d.id,
            label: `${d.vehicle?.license_plate ?? 'Fahrzeug'} - ${d.description?.substring(0, 30) ?? 'Schaden'}`,
          })) ?? []
        );
      case 'appointment':
        return (
          appointments?.map((a) => ({
            value: a.id,
            label: `${a.vehicle?.license_plate ?? 'Fahrzeug'} - ${a.appointment_type?.name ?? 'Termin'}`,
          })) ?? []
        );
      default:
        return [];
    }
  };

  /**
   * Validiert und setzt die ausgewählte Datei
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Dateityp prüfen
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
      return;
    }

    // Dateigröße prüfen
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      return;
    }

    setFile(selectedFile);

    // Dokumentname aus Dateiname vorschlagen, wenn leer
    if (!form.getValues('name')) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      form.setValue('name', nameWithoutExt);
    }
  };

  /**
   * Entfernt die ausgewählte Datei
   */
  const handleRemoveFile = (): void => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Formular absenden
   */
  const onSubmit = async (data: UploadFormData): Promise<void> => {
    if (!file) {
      toast.error('Bitte wähle eine Datei aus');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        entityType: data.entityType,
        entityId: data.entityId,
        document_type_id: data.documentTypeId,
        name: data.name,
        notes: data.notes || null,
        file,
      });

      // Dialog schließen und zurücksetzen
      setOpen(false);
      setFile(null);
      form.reset();
    } catch (error) {
      // Fehler wird vom Hook gehandelt
    }
  };

  /**
   * Dialog schließen und zurücksetzen
   */
  const handleOpenChange = (newOpen: boolean): void => {
    setOpen(newOpen);
    if (!newOpen) {
      setFile(null);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Dokument hochladen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dokument hochladen</DialogTitle>
          <DialogDescription>
            Lade ein neues Dokument hoch und ordne es einer Entität zu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Datei-Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Datei *</label>
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
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
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klicken zum Auswählen
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG, WEBP - Max. 10 MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Herkunft (Entity-Typ) */}
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Herkunft *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Entity-ID zurücksetzen wenn Typ geändert
                      form.setValue('entityId', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Herkunft auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entityTypeOptions.map((option) => (
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

            {/* Eintrag (Entity) */}
            {selectedEntityType && (
              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eintrag *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Eintrag auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getEntityOptions().map((option) => (
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

            {/* Dokumenttyp */}
            <FormField
              control={form.control}
              name="documentTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumenttyp *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Dokumenttyp auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes?.map((type) => (
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

            {/* Dokumentname */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumentname *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. TÜV-Bescheinigung 2024" {...field} />
                  </FormControl>
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
                      placeholder="Optionale Notizen zum Dokument..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aktionen */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={uploadMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending || !file}>
                {uploadMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Hochladen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
