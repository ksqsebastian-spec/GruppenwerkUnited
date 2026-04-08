'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Building } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/use-companies';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Company } from '@/types';

/**
 * Firmen-Verwaltung in den Einstellungen
 */
export function CompanyList(): React.JSX.Element {
  const { data: companies, isLoading, error, refetch } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');

  const handleCreate = (): void => {
    setSelectedCompany(null);
    setCompanyName('');
    setEditDialogOpen(true);
  };

  const handleEdit = (company: Company): void => {
    setSelectedCompany(company);
    setCompanyName(company.name);
    setEditDialogOpen(true);
  };

  const handleDelete = (company: Company): void => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const confirmSave = async (): Promise<void> => {
    if (!companyName.trim()) return;

    if (selectedCompany) {
      await updateMutation.mutateAsync({
        id: selectedCompany.id,
        data: { name: companyName.trim() },
      });
    } else {
      await createMutation.mutateAsync({ name: companyName.trim() });
    }

    setEditDialogOpen(false);
    setCompanyName('');
    setSelectedCompany(null);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedCompany) {
      await deleteMutation.mutateAsync(selectedCompany.id);
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
    }
  };

  // Render-Funktion für den Hauptinhalt
  const renderContent = (): React.JSX.Element => {
    if (isLoading) {
      return <LoadingSpinner text="Firmen werden geladen..." />;
    }

    if (error) {
      return (
        <ErrorState
          message="Firmen konnten nicht geladen werden"
          onRetry={refetch}
        />
      );
    }

    if (!companies || companies.length === 0) {
      return (
        <EmptyState
          icon={<Building className="h-12 w-12 text-muted-foreground" />}
          title="Keine Firmen angelegt"
          description="Lege deine erste Firma an, um Fahrzeuge zuordnen zu können."
          action={
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Firma anlegen
            </Button>
          }
        />
      );
    }

    return (
      <>
        <div className="flex justify-end mb-4">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Firma
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Angelegt am</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {company.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(company.created_at), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(company)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Bearbeiten</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="sr-only">Löschen</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Hauptinhalt (Ladevorgang, Fehler, Leer-Zustand oder Tabelle) */}
      {renderContent()}

      {/* Bearbeiten/Erstellen Dialog - IMMER gerendert */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? 'Firma bearbeiten' : 'Neue Firma anlegen'}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? 'Ändere den Namen der Firma.'
                : 'Gib den Namen der neuen Firma ein.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="z.B. Gruppenwerk GmbH"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={confirmSave}
              disabled={
                !companyName.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {selectedCompany ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Löschen Dialog - IMMER gerendert */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Firma löschen"
        description={`Möchtest du die Firma "${selectedCompany?.name}" wirklich löschen? Alle zugeordneten Fahrzeuge und Fahrer müssen vorher einer anderen Firma zugeordnet werden.`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
