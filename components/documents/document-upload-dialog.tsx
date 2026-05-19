'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useDocumentTypes, useUploadDocument } from '@/hooks/use-documents';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useDamages } from '@/hooks/use-damages';
import { useAppointments } from '@/hooks/use-appointments';
import type { DocumentEntityType } from '@/types';
import { DocumentUploadFileDrop } from './document-upload-dialog-file-drop';
import {
  DocumentUploadFields,
  type EntityOption,
  type UploadFormData,
} from './document-upload-dialog-fields';

const uploadSchema = z.object({
  entityType: z.enum(['vehicle', 'damage', 'appointment', 'driver'], {
    required_error: 'Bitte wähle eine Herkunft',
  }),
  entityId: z.string().min(1, 'Bitte wähle einen Eintrag'),
  documentTypeId: z.string().min(1, 'Bitte wähle einen Dokumenttyp'),
  name: z.string().min(1, 'Bitte gib einen Namen ein'),
  notes: z.string().optional(),
});

interface DocumentUploadDialogProps {
  /** Trigger-Button (optional, Standard ist Plus-Button) */
  trigger?: React.ReactNode;
}

/**
 * Dialog zum Hochladen eines neuen Dokuments mit Entity-Auswahl
 */
export function DocumentUploadDialog({ trigger }: DocumentUploadDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { data: documentTypes } = useDocumentTypes();
  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: drivers } = useDrivers({ status: 'active' });
  const { data: damages } = useDamages();
  const { data: appointments } = useAppointments();
  const uploadMutation = useUploadDocument();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      entityType: undefined as unknown as DocumentEntityType,
      entityId: '',
      documentTypeId: '',
      name: '',
      notes: '',
    },
  });

  const selectedEntityType = form.watch('entityType');

  const getEntityOptions = (): EntityOption[] => {
    switch (selectedEntityType) {
      case 'vehicle':
        return vehicles?.map((v) => ({ value: v.id, label: `${v.license_plate} - ${v.brand} ${v.model}` })) ?? [];
      case 'driver':
        return drivers?.map((d) => ({ value: d.id, label: `${d.first_name} ${d.last_name}` })) ?? [];
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
      setOpen(false);
      setFile(null);
      form.reset();
    } catch {
      // Fehler wird vom Hook gehandelt
    }
  };

  const handleOpenChange = (newOpen: boolean): void => {
    setOpen(newOpen);
    if (!newOpen) {
      setFile(null);
      form.reset();
    }
  };

  const handleSuggestName = (suggested: string): void => {
    if (!form.getValues('name')) form.setValue('name', suggested);
  };

  const handleEntityTypeChange = (): void => {
    form.setValue('entityId', '');
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
            <DocumentUploadFileDrop file={file} onFileChange={setFile} onSuggestName={handleSuggestName} />

            <DocumentUploadFields
              form={form}
              selectedEntityType={selectedEntityType}
              entityOptions={getEntityOptions()}
              documentTypes={documentTypes}
              onEntityTypeChange={handleEntityTypeChange}
            />

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
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hochladen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
