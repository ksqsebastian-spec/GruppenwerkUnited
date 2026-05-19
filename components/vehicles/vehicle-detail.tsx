'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Pencil,
  Archive,
  Trash2,
  Calendar,
  AlertTriangle,
  Receipt,
  FileText,
  User,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { DocumentList } from '@/components/documents';
import { useArchiveVehicle, useDeleteVehicle } from '@/hooks/use-vehicles';
import { useDocuments } from '@/hooks/use-documents';
import type { Vehicle } from '@/types';

import { getTuvStatus } from './vehicle-detail-helpers';
import { VehicleInfoCards } from './vehicle-detail-info-cards';
import { VehicleDetailsTab } from './vehicle-detail-tab';

interface VehicleDetailProps {
  /** Das anzuzeigende Fahrzeug */
  vehicle: Vehicle;
}

/**
 * Detailansicht für ein Fahrzeug
 */
export function VehicleDetail({ vehicle }: VehicleDetailProps): React.JSX.Element {
  const router = useRouter();
  const archiveMutation = useArchiveVehicle();
  const deleteMutation = useDeleteVehicle();

  // Dokumente für dieses Fahrzeug laden
  const { data: documents, isLoading: documentsLoading } = useDocuments('vehicle', vehicle.id);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const confirmArchive = async (): Promise<void> => {
    await archiveMutation.mutateAsync(vehicle.id);
    setArchiveDialogOpen(false);
    router.push('/fuhrpark/vehicles');
  };

  const confirmDelete = async (): Promise<void> => {
    await deleteMutation.mutateAsync(vehicle.id);
    setDeleteDialogOpen(false);
    router.push('/fuhrpark/vehicles');
  };

  const tuvStatus = getTuvStatus(vehicle.tuv_due_date);

  return (
    <div className="space-y-6">
      {/* Header mit Aktionen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{vehicle.license_plate}</h1>
            <p className="text-muted-foreground">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </p>
          </div>
          {vehicle.status === 'archived' && <Badge variant="secondary">Archiviert</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fuhrpark/vehicles/${vehicle.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setArchiveDialogOpen(true)}>
            <Archive className="mr-2 h-4 w-4" />
            Archivieren
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Info-Karten */}
      <VehicleInfoCards vehicle={vehicle} tuvStatus={tuvStatus} />

      {/* Tabs für Details */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <Info className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="mr-2 h-4 w-4" />
            Termine
          </TabsTrigger>
          <TabsTrigger value="damages">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Schäden
          </TabsTrigger>
          <TabsTrigger value="costs">
            <Receipt className="mr-2 h-4 w-4" />
            Kosten
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="drivers">
            <User className="mr-2 h-4 w-4" />
            Fahrer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <VehicleDetailsTab vehicle={vehicle} />
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Hier werden die Termine für dieses Fahrzeug angezeigt.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/fuhrpark/appointments/new?vehicleId=${vehicle.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Neuen Termin anlegen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damages">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Hier werden die Schäden für dieses Fahrzeug angezeigt.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/fuhrpark/damages/new?vehicleId=${vehicle.id}`}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Schaden melden
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Hier werden die Kosten für dieses Fahrzeug angezeigt.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/fuhrpark/costs/new?vehicleId=${vehicle.id}`}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Kosten erfassen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/fuhrpark/documents/upload?vehicleId=${vehicle.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Dokument hochladen
              </Link>
            </Button>
          </div>
          {documentsLoading ? (
            <LoadingSpinner text="Dokumente werden geladen..." />
          ) : documents && documents.length > 0 ? (
            <DocumentList documents={documents} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Keine Dokumente für dieses Fahrzeug vorhanden.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Hier werden die Fahrer für dieses Fahrzeug angezeigt.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/fuhrpark/vehicles/${vehicle.id}/assign-driver`}>
                  <User className="mr-2 h-4 w-4" />
                  Fahrer zuweisen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialoge */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Fahrzeug archivieren"
        description={`Möchtest du das Fahrzeug "${vehicle.license_plate}" wirklich archivieren?`}
        confirmText="Archivieren"
        onConfirm={confirmArchive}
        isLoading={archiveMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Fahrzeug löschen"
        description={`Möchtest du das Fahrzeug "${vehicle.license_plate}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
