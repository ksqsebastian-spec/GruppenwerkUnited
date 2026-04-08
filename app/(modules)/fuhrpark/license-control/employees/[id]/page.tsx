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
  Building,
  CreditCard,
  Calendar,
  FileText,
  Plus,
  ClipboardCheck,
  Hash,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentList } from '@/components/documents';
import { DocumentUpload } from '@/components/documents/document-upload';
import {
  LicenseStatusBadge,
  CheckDialog,
  CheckHistory,
} from '@/components/license-control';
import { useLicenseEmployee, useArchiveLicenseEmployee } from '@/hooks/use-license-control';
import { useLicenseEmployeeDocuments } from '@/hooks/use-documents';

/**
 * Führerscheinkontrolle - Mitarbeiter-Detailseite
 */
export default function LicenseEmployeeDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const { data: employee, isLoading, error, refetch } = useLicenseEmployee(employeeId);
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useLicenseEmployeeDocuments(employeeId);
  const archiveMutation = useArchiveLicenseEmployee();

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);

  const confirmArchive = async (): Promise<void> => {
    await archiveMutation.mutateAsync(employeeId);
    setArchiveDialogOpen(false);
    router.push('/fuhrpark/license-control/employees');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner text="Mitarbeiter wird geladen..." />
      </AppLayout>
    );
  }

  if (error || !employee) {
    return (
      <AppLayout>
        <ErrorState
          message="Mitarbeiter konnte nicht geladen werden"
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-muted-foreground">{employee.company?.name}</p>
            </div>
            {employee.status === 'archived' && (
              <Badge variant="secondary">Archiviert</Badge>
            )}
            {employee.check_status && (
              <LicenseStatusBadge status={employee.check_status} />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setCheckDialogOpen(true)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Kontrolle durchführen
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/fuhrpark/license-control/employees/${employee.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </Button>
            {employee.status !== 'archived' && (
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
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Personalnummer</p>
                  <p className="text-sm font-medium">
                    {employee.personnel_number ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p className="text-sm font-medium">
                    {employee.email ? (
                      <a href={`mailto:${employee.email}`} className="hover:underline">
                        {employee.email}
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
                  <p className="text-sm text-muted-foreground">Führerscheinklassen</p>
                  <p className="text-sm font-medium">
                    {employee.license_classes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nächste Kontrolle</p>
                  <p className="text-sm font-medium">
                    {employee.next_check_due
                      ? format(new Date(employee.next_check_due), 'dd.MM.yyyy', { locale: de })
                      : 'Noch keine Kontrolle'}
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
              <DetailRow label="Vorname" value={employee.first_name} />
              <DetailRow label="Nachname" value={employee.last_name} />
              <DetailRow label="Personalnummer" value={employee.personnel_number ?? '-'} />
              <DetailRow label="E-Mail" value={employee.email ?? '-'} />
              <DetailRow label="Firma" value={employee.company?.name ?? '-'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Führerschein</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Klassen" value={employee.license_classes} />
              <DetailRow label="Führerscheinnummer" value={employee.license_number ?? '-'} />
              <DetailRow
                label="Gültig bis"
                value={
                  employee.license_expiry_date
                    ? format(new Date(employee.license_expiry_date), 'dd.MM.yyyy', { locale: de })
                    : 'Unbefristet'
                }
              />
            </CardContent>
          </Card>

          {/* Kontroll-Historie */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Kontroll-Historie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CheckHistory employeeId={employeeId} />
            </CardContent>
          </Card>

          {/* Notizen */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {employee.notes ?? 'Keine Notizen vorhanden.'}
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
                  entityType="license_check_employee"
                  entityId={employeeId}
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
                  Keine Dokumente vorhanden. Hier können unterschriebene Kontrollbestätigungen
                  oder Führerschein-Kopien hinterlegt werden.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kontrolle durchführen Dialog */}
        <CheckDialog
          employee={employee}
          open={checkDialogOpen}
          onOpenChange={setCheckDialogOpen}
        />

        {/* Archivieren Dialog */}
        <ConfirmDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title="Mitarbeiter archivieren"
          description={`Möchtest du den Mitarbeiter "${employee.first_name} ${employee.last_name}" wirklich archivieren? Der Mitarbeiter wird aus der aktiven Liste entfernt, die Kontroll-Historie bleibt erhalten.`}
          confirmText="Archivieren"
          onConfirm={confirmArchive}
          isLoading={archiveMutation.isPending}
        />
      </div>
    </AppLayout>
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
