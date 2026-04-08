'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
  Building,
  Gauge,
  Fuel,
  Shield,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { DocumentList } from '@/components/documents';
import { useArchiveVehicle, useDeleteVehicle } from '@/hooks/use-vehicles';
import { useDocuments } from '@/hooks/use-documents';
import type { Vehicle } from '@/types';

interface VehicleDetailProps {
  /** Das anzuzeigende Fahrzeug */
  vehicle: Vehicle;
}

/**
 * Mappt Kraftstofftypen auf deutsche Bezeichnungen
 */
const fuelTypeLabels: Record<string, string> = {
  diesel: 'Diesel',
  benzin: 'Benzin',
  elektro: 'Elektro',
  hybrid_benzin: 'Hybrid (Benzin)',
  hybrid_diesel: 'Hybrid (Diesel)',
  gas: 'Gas',
};

/**
 * Formatiert den Kilometerstand
 */
function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('de-DE').format(mileage) + ' km';
}

/**
 * Formatiert einen Euro-Betrag
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Detailansicht für ein Fahrzeug
 */
export function VehicleDetail({ vehicle }: VehicleDetailProps): JSX.Element {
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

  /**
   * Prüft TÜV-Status
   */
  const getTuvStatus = (): { status: 'ok' | 'warning' | 'overdue'; label: string } => {
    if (!vehicle.tuv_due_date) return { status: 'ok', label: 'Nicht erfasst' };

    const due = new Date(vehicle.tuv_due_date);
    const now = new Date();
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { status: 'overdue', label: `${Math.abs(daysUntil)} Tage überfällig` };
    if (daysUntil <= 30) return { status: 'warning', label: `In ${daysUntil} Tagen fällig` };
    return { status: 'ok', label: format(due, 'MMMM yyyy', { locale: de }) };
  };

  const tuvStatus = getTuvStatus();

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
          {vehicle.status === 'archived' && (
            <Badge variant="secondary">Archiviert</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fuhrpark/vehicles/${vehicle.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setArchiveDialogOpen(true)}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archivieren
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Info-Karten */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Kilometerstand</p>
                <p className="text-lg font-medium">{formatMileage(vehicle.mileage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Fuel className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Kraftstoff</p>
                <p className="text-lg font-medium">
                  {fuelTypeLabels[vehicle.fuel_type] ?? vehicle.fuel_type}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Firma</p>
                <p className="text-lg font-medium">{vehicle.company?.name ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={tuvStatus.status !== 'ok' ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield
                className={`h-5 w-5 ${
                  tuvStatus.status === 'overdue'
                    ? 'text-red-600'
                    : tuvStatus.status === 'warning'
                    ? 'text-yellow-600'
                    : 'text-muted-foreground'
                }`}
              />
              <div>
                <p className="text-sm text-muted-foreground">TÜV</p>
                <p
                  className={`text-lg font-medium ${
                    tuvStatus.status === 'overdue'
                      ? 'text-red-600'
                      : tuvStatus.status === 'warning'
                      ? 'text-yellow-600'
                      : ''
                  }`}
                >
                  {tuvStatus.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fahrzeugdaten */}
            <Card>
              <CardHeader>
                <CardTitle>Fahrzeugdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Kennzeichen" value={vehicle.license_plate} />
                <DetailRow label="Marke" value={vehicle.brand} />
                <DetailRow label="Modell" value={vehicle.model} />
                <DetailRow label="Baujahr" value={vehicle.year.toString()} />
                <DetailRow label="VIN" value={vehicle.vin ?? '-'} />
                <DetailRow
                  label="Kraftstoff"
                  value={fuelTypeLabels[vehicle.fuel_type] ?? vehicle.fuel_type}
                />
                <DetailRow label="Kilometerstand" value={formatMileage(vehicle.mileage)} />
              </CardContent>
            </Card>

            {/* Kauf/Leasing */}
            <Card>
              <CardHeader>
                <CardTitle>Kauf / Leasing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow
                  label="Art"
                  value={vehicle.is_leased ? 'Leasing' : 'Kauf'}
                />
                {vehicle.is_leased ? (
                  <>
                    <DetailRow
                      label="Leasinggeber"
                      value={vehicle.leasing_company ?? '-'}
                    />
                    <DetailRow
                      label="Leasingende"
                      value={
                        vehicle.leasing_end_date
                          ? format(new Date(vehicle.leasing_end_date), 'dd.MM.yyyy', { locale: de })
                          : '-'
                      }
                    />
                    <DetailRow
                      label="Monatliche Rate"
                      value={formatCurrency(vehicle.leasing_rate)}
                    />
                    <DetailRow
                      label="Vertragsnummer"
                      value={vehicle.leasing_contract_number ?? '-'}
                    />
                  </>
                ) : (
                  <>
                    <DetailRow
                      label="Kaufdatum"
                      value={
                        vehicle.purchase_date
                          ? format(new Date(vehicle.purchase_date), 'dd.MM.yyyy', { locale: de })
                          : '-'
                      }
                    />
                    <DetailRow label="Kaufpreis" value={formatCurrency(vehicle.purchase_price)} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Halter & Nutzer */}
            <Card>
              <CardHeader>
                <CardTitle>Halter & Nutzer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Fahrzeughalter" value={vehicle.holder ?? '-'} />
                <DetailRow label="Hauptnutzer" value={vehicle.user_name ?? '-'} />
              </CardContent>
            </Card>

            {/* Versicherung */}
            <Card>
              <CardHeader>
                <CardTitle>Versicherung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Versicherung" value={vehicle.insurance_company ?? '-'} />
                <DetailRow label="Vertragsnummer" value={vehicle.insurance_number ?? '-'} />
              </CardContent>
            </Card>

            {/* Notizen */}
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {vehicle.notes ?? 'Keine Notizen vorhanden.'}
                </p>
              </CardContent>
            </Card>
          </div>
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

/**
 * Hilfskomponente für Detail-Zeilen
 */
function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between border-b pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
