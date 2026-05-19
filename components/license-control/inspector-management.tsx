'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  licenseInspectorSchema,
  type LicenseInspectorFormData,
} from '@/lib/validations/license-control';
import {
  useLicenseInspectors,
  useCreateLicenseInspector,
  useUpdateLicenseInspector,
  useArchiveLicenseInspector,
} from '@/hooks/use-license-control';
import type { LicenseCheckInspector } from '@/types';
import { InspectorManagementTable } from './inspector-management-table';
import { InspectorManagementDialog } from './inspector-management-dialog';

/**
 * Verwaltung der Prüfer für Führerscheinkontrollen
 */
export function InspectorManagement(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<LicenseCheckInspector | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [inspectorToArchive, setInspectorToArchive] = useState<LicenseCheckInspector | null>(null);

  const { data: inspectors = [], isLoading } = useLicenseInspectors();
  const createMutation = useCreateLicenseInspector();
  const updateMutation = useUpdateLicenseInspector();
  const archiveMutation = useArchiveLicenseInspector();

  const form = useForm<LicenseInspectorFormData>({
    resolver: zodResolver(licenseInspectorSchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'active',
    },
  });

  const handleOpenDialog = (inspector?: LicenseCheckInspector): void => {
    if (inspector) {
      setEditingInspector(inspector);
      form.reset({
        name: inspector.name,
        email: inspector.email ?? '',
        status: inspector.status,
      });
    } else {
      setEditingInspector(null);
      form.reset({ name: '', email: '', status: 'active' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (data: LicenseInspectorFormData): Promise<void> => {
    const insertData = {
      name: data.name,
      email: data.email || null,
      status: data.status,
    };

    if (editingInspector) {
      await updateMutation.mutateAsync({ id: editingInspector.id, data: insertData });
    } else {
      await createMutation.mutateAsync(insertData);
    }
    setDialogOpen(false);
    setEditingInspector(null);
    form.reset();
  };

  const handleArchiveClick = (inspector: LicenseCheckInspector): void => {
    setInspectorToArchive(inspector);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (inspectorToArchive) {
      await archiveMutation.mutateAsync(inspectorToArchive.id);
      setArchiveDialogOpen(false);
      setInspectorToArchive(null);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const activeInspectors = inspectors.filter((i) => i.status === 'active');
  const archivedInspectors = inspectors.filter((i) => i.status === 'archived');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="border rounded-lg">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Prüfer verwalten</h3>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Prüfer hinzufügen
        </Button>
      </div>

      {activeInspectors.length === 0 ? (
        <EmptyState
          title="Keine Prüfer vorhanden"
          description="Lege mindestens einen Prüfer an, um Führerscheinkontrollen durchzuführen."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ersten Prüfer anlegen
            </Button>
          }
        />
      ) : (
        <InspectorManagementTable
          activeInspectors={activeInspectors}
          archivedInspectors={archivedInspectors}
          onEdit={handleOpenDialog}
          onArchive={handleArchiveClick}
        />
      )}

      <InspectorManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={editingInspector !== null}
        isSubmitting={isSubmitting}
        form={form}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Prüfer archivieren"
        description={`Möchtest du "${inspectorToArchive?.name}" wirklich archivieren? Der Prüfer kann dann keine neuen Kontrollen mehr durchführen.`}
        confirmText="Archivieren"
        onConfirm={handleArchiveConfirm}
        destructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
