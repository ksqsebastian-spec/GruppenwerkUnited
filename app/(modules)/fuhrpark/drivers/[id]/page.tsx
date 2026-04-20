'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  User,
  Pencil,
  Archive,
  Mail,
  Phone,
  Building,
  CreditCard,
  Calendar,
  Car,
  FileText,
  Plus,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentList } from '@/components/documents';
import { DocumentUpload } from '@/components/documents/document-upload';
import { useDriver, useArchiveDriver } from '@/hooks/use-drivers';
import { useDriverDocuments } from '@/hooks/use-documents';

/**
 * Fahrer-Detailseite
 */
export default function DriverDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const { data: driver, isLoading, error, refetch } = useDriver(driverId);
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useDriverDocuments(driverId);
  const archiveMutation = useArchiveDriver();

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const confirmArchive = async (): Promise<void> => {
    await archiveMutation.mutateAsync(driverId);
    setArchiveDialogOpen(false);
    router.push('/fuhrpark/drivers');
  };

  if (isLoading) {
    return (
      <>
        <LoadingSpinner text="Fahrer wird geladen..." />
      </>
    );
  }

  if (error || !driver) {
    return (
      <>
        <ErrorState
          message="Fahrer konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  /**
   * Prüft Führerschein-Status
   */
  const getLicenseStatus = (): { status: 'ok' | 'warning' | 'expired'; label: string } => {
    if (!driver.license_expiry) return { status: 'ok', label: 'Nicht erfasst' };

    const expiry = new Date(driver.license_expiry);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { status: 'expired', label: `Abgelaufen seit ${Math.abs(daysUntil)} Tagen` };
    if (daysUntil <= 90) return { status: 'warning', label: `Läuft ab in ${daysUntil} Tagen` };
    return { status: 'ok', label: format(expiry, 'dd.MM.yyyy', { locale: de }) };
  };

  const licenseStatus = getLicenseStatus();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {driver.first_name} {driver.last_name}
              </h1>
              <p className="text-muted-foreground">{driver.company?.name}</p>
            </div>
            {driver.status === 'archived' && (
              <Badge variant="secondary">Archiviert</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/fuhrpark/drivers/${driver.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </Button>
            {driver.status !== 'archived' && (
              <Button
                variant="outline"
                onClick={() => setArchiveDialogOpen(true)}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archivieren
              </Button>
            )}
          </div>
        </div>

        {/* Info-Karten */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p className="text-sm font-medium">
                    {driver.email ? (
                      <a href={`mailto:${driver.email}`} className="hover:underline">
                        {driver.email}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="text-sm font-medium">
                    {driver.phone ? (
                      <a href={`tel:${driver.phone}`} className="hover:underline">
                        {driver.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Führerschein</p>
                  <p className="text-sm font-medium">
                    {driver.license_class ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={licenseStatus.status !== 'ok' ? 'border-yellow-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar
                  className={`h-5 w-5 ${
                    licenseStatus.status === 'expired'
                      ? 'text-red-600'
                      : licenseStatus.status === 'warning'
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <p className="text-sm text-muted-foreground">Gültig bis</p>
                  <p
                    className={`text-sm font-medium ${
                      licenseStatus.status === 'expired'
                        ? 'text-red-600'
                        : licenseStatus.status === 'warning'
                        ? 'text-yellow-600'
                        : ''
                    }`}
                  >
                    {licenseStatus.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Daten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Vorname" value={driver.first_name} />
              <DetailRow label="Nachname" value={driver.last_name} />
              <DetailRow label="E-Mail" value={driver.email ?? '-'} />
              <DetailRow label="Telefon" value={driver.phone ?? '-'} />
              <DetailRow label="Firma" value={driver.company?.name ?? '-'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Führerschein</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Klasse" value={driver.license_class ?? '-'} />
              <DetailRow label="Gültig bis" value={licenseStatus.label} />
            </CardContent>
          </Card>

          {/* Zugewiesene Fahrzeuge */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Zugewiesene Fahrzeuge</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/fuhrpark/drivers/${driver.id}/assign-vehicle`}>
                  <Car className="mr-2 h-4 w-4" />
                  Fahrzeug zuweisen
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hier werden die zugewiesenen Fahrzeuge angezeigt.
              </p>
            </CardContent>
          </Card>

          {/* Notizen */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {driver.notes ?? 'Keine Notizen vorhanden.'}
              </p>
            </CardContent>
          </Card>

          {/* Dokumente */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dokumente
              </CardTitle>
              <Button
                size="sm"
                variant={showUpload ? 'secondary' : 'default'}
                onClick={() => setShowUpload(!showUpload)}
              >
                {showUpload ? (
                  'Abbrechen'
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Dokument hinzufügen
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {showUpload ? (
                <DocumentUpload
                  entityType="driver"
                  entityId={driverId}
                  onSuccess={() => {
                    setShowUpload(false);
                    refetchDocuments();
                  }}
                  onCancel={() => setShowUpload(false)}
                />
              ) : documentsLoading ? (
                <p className="text-sm text-muted-foreground">Dokumente werden geladen...</p>
              ) : documents && documents.length > 0 ? (
                <DocumentList documents={documents} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keine Dokumente vorhanden. Hier können z.B. Führerschein-Kopien oder Arbeitsverträge hinterlegt werden.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Archivieren Dialog */}
        <ConfirmDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title="Fahrer archivieren"
          description={`Möchtest du den Fahrer "${driver.first_name} ${driver.last_name}" wirklich archivieren?`}
          confirmText="Archivieren"
          onConfirm={confirmArchive}
          isLoading={archiveMutation.isPending}
        />
      </div>
    </>
  );
}

/**
 * Hilfskomponente für Detail-Zeilen
 */
function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex justify-between border-b pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
