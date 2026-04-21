'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Archive, Loader2, UserCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
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
  useUpdateDriverInspectorFlag,
} from '@/hooks/use-license-control';
import { useDrivers } from '@/hooks/use-drivers';
import type { LicenseCheckInspector, Driver } from '@/types';

/**
 * Verwaltung der Prüfer für Führerscheinkontrollen
 * Erlaubt manuelles Anlegen oder Auswahl aus Fahrerliste
 */
export function InspectorManagement(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<LicenseCheckInspector | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [inspectorToArchive, setInspectorToArchive] = useState<LicenseCheckInspector | null>(null);

  const { data: inspectors = [], isLoading } = useLicenseInspectors();
  const { data: drivers = [] } = useDrivers({ status: 'active' });
  const createMutation = useCreateLicenseInspector();
  const updateMutation = useUpdateLicenseInspector();
  const archiveMutation = useArchiveLicenseInspector();
  const updateDriverFlag = useUpdateDriverInspectorFlag();

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

  const handleAppointDriver = async (driver: Driver): Promise<void> => {
    // Prüfer-Eintrag aus Fahrerdaten erstellen
    await createMutation.mutateAsync({
      name: `${driver.first_name} ${driver.last_name}`,
      email: driver.email,
      status: 'active',
    });
    // Prüfer-Flag beim Fahrer setzen
    await updateDriverFlag.mutateAsync({ driverId: driver.id, isInspector: true });
    setDriverDialogOpen(false);
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

  // Fahrer, die noch kein Prüfer-Eintrag haben (vereinfachte Prüfung über is_license_inspector)
  const availableDrivers = drivers.filter((d) => !d.is_license_inspector);

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
        <div className="flex gap-2">
          {availableDrivers.length > 0 && (
            <Button variant="secondary" onClick={() => setDriverDialogOpen(true)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Fahrer als Prüfer
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Prüfer hinzufügen
          </Button>
        </div>
      </div>

      {activeInspectors.length === 0 ? (
        <EmptyState
          title="Keine Prüfer vorhanden"
          description="Lege mindestens einen Prüfer an oder erenne einen Fahrer zum Prüfer."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ersten Prüfer anlegen
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeInspectors.map((inspector) => (
                <TableRow key={inspector.id}>
                  <TableCell className="font-medium">{inspector.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {inspector.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Aktiv
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(inspector)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchiveClick(inspector)}
                      >
                        <Archive className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {archivedInspectors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Archivierte Prüfer ({archivedInspectors.length})
          </h4>
          <div className="border rounded-lg opacity-60">
            <Table>
              <TableBody>
                {archivedInspectors.map((inspector) => (
                  <TableRow key={inspector.id}>
                    <TableCell>{inspector.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {inspector.email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Archiviert</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Prüfer manuell anlegen/bearbeiten */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingInspector ? 'Prüfer bearbeiten' : 'Neuen Prüfer anlegen'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Max Mustermann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="max@firma.de"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : editingInspector ? (
                    'Änderungen speichern'
                  ) : (
                    'Prüfer anlegen'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Fahrer als Prüfer ernennen */}
      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fahrer als Prüfer ernennen</DialogTitle>
            <DialogDescription>
              Wähle einen Fahrer aus, der Führerscheinkontrollen durchführen darf.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {availableDrivers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Alle Fahrer sind bereits als Prüfer eingetragen
              </p>
            ) : (
              availableDrivers.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  className="w-full flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 text-left"
                  onClick={() => handleAppointDriver(driver)}
                  disabled={createMutation.isPending || updateDriverFlag.isPending}
                >
                  <div>
                    <span className="text-sm font-medium">
                      {driver.last_name}, {driver.first_name}
                    </span>
                    {driver.email && (
                      <span className="block text-xs text-muted-foreground">{driver.email}</span>
                    )}
                  </div>
                  {(createMutation.isPending || updateDriverFlag.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
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
