'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Calendar,
  Pencil,
  Trash2,
  Car,
  CheckCircle,
  Clock,
  AlertTriangle,
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
import {
  useAppointment,
  useCompleteAppointment,
  useDeleteAppointment,
} from '@/hooks/use-appointments';
import { useAppointmentDocuments } from '@/hooks/use-documents';
import type { AppointmentStatus } from '@/types';

/**
 * Status-Badge Varianten
 */
const statusVariants: Record<AppointmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  completed: 'outline',
  overdue: 'destructive',
};

/**
 * Status-Labels auf Deutsch
 */
const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Ausstehend',
  completed: 'Erledigt',
  overdue: 'Überfällig',
};

/**
 * Status-Icons
 */
function StatusIcon({ status }: { status: AppointmentStatus }): React.JSX.Element {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'overdue':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-600" />;
  }
}

/**
 * Berechnet den dynamischen Status basierend auf Fälligkeitsdatum
 */
function calculateStatus(appointment: { status: AppointmentStatus; due_date: string }): AppointmentStatus {
  if (appointment.status === 'completed') return 'completed';

  const dueDate = new Date(appointment.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) return 'overdue';
  return 'pending';
}

/**
 * Termin-Detailseite
 */
export default function AppointmentDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const { data: appointment, isLoading, error, refetch } = useAppointment(appointmentId);
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useAppointmentDocuments(appointmentId);
  const completeMutation = useCompleteAppointment();
  const deleteMutation = useDeleteAppointment();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleComplete = async (): Promise<void> => {
    await completeMutation.mutateAsync(appointmentId);
    setCompleteDialogOpen(false);
    refetch();
  };

  const confirmDelete = async (): Promise<void> => {
    await deleteMutation.mutateAsync(appointmentId);
    setDeleteDialogOpen(false);
    router.push('/fuhrpark/appointments');
  };

  if (isLoading) {
    return (
      <>
        <LoadingSpinner text="Termin wird geladen..." />
      </>
    );
  }

  if (error || !appointment) {
    return (
      <>
        <ErrorState
          message="Termin konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  const displayStatus = calculateStatus(appointment);
  const dueDate = new Date(appointment.due_date);
  const isOverdue = displayStatus === 'overdue';
  const isCompleted = displayStatus === 'completed';

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{
                backgroundColor: appointment.appointment_type?.color
                  ? `${appointment.appointment_type.color}20`
                  : '#f3f4f6',
              }}
            >
              <Calendar
                className="h-6 w-6"
                style={{ color: appointment.appointment_type?.color ?? '#6b7280' }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {appointment.appointment_type?.name ?? 'Termin'}
              </h1>
              <p className="text-muted-foreground">
                {appointment.vehicle?.license_plate} - Fällig am{' '}
                {format(dueDate, 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
            <Badge variant={statusVariants[displayStatus]}>
              {statusLabels[displayStatus]}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <Button
                variant="default"
                onClick={() => setCompleteDialogOpen(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Als erledigt markieren
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/fuhrpark/appointments/${appointment.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
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
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fahrzeug</p>
                  <Link
                    href={`/fuhrpark/vehicles/${appointment.vehicle_id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {appointment.vehicle?.license_plate ?? '-'}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar
                  className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}
                />
                <div>
                  <p className="text-sm text-muted-foreground">Fälligkeitsdatum</p>
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {format(dueDate, 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded"
                  style={{
                    backgroundColor: appointment.appointment_type?.color ?? '#6b7280',
                  }}
                />
                <div>
                  <p className="text-sm text-muted-foreground">Termintyp</p>
                  <p className="text-sm font-medium">
                    {appointment.appointment_type?.name ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <StatusIcon status={displayStatus} />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">
                    {statusLabels[displayStatus]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fahrzeug-Details */}
          <Card>
            <CardHeader>
              <CardTitle>Fahrzeug-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Kennzeichen" value={appointment.vehicle?.license_plate ?? '-'} />
              <DetailRow
                label="Fahrzeug"
                value={
                  appointment.vehicle
                    ? `${appointment.vehicle.brand} ${appointment.vehicle.model}`
                    : '-'
                }
              />
            </CardContent>
          </Card>

          {/* Termin-Details */}
          <Card>
            <CardHeader>
              <CardTitle>Termin-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Termintyp" value={appointment.appointment_type?.name ?? '-'} />
              <DetailRow
                label="Fällig am"
                value={format(dueDate, 'dd.MM.yyyy', { locale: de })}
              />
              {appointment.completed_date && (
                <DetailRow
                  label="Erledigt am"
                  value={format(new Date(appointment.completed_date), 'dd.MM.yyyy', {
                    locale: de,
                  })}
                />
              )}
            </CardContent>
          </Card>

          {/* Notizen */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {appointment.notes ?? 'Keine Notizen vorhanden.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dokumente */}
        <Card>
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
                entityType="appointment"
                entityId={appointmentId}
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
                Keine Dokumente vorhanden. Hier können z.B. Prüfberichte oder Rechnungen hinterlegt werden.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Als erledigt markieren Dialog */}
        <ConfirmDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          title="Termin als erledigt markieren"
          description={`Möchtest du den Termin "${appointment.appointment_type?.name ?? 'Termin'}" als erledigt markieren?`}
          confirmText="Als erledigt markieren"
          onConfirm={handleComplete}
          isLoading={completeMutation.isPending}
        />

        {/* Löschen Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Termin löschen"
          description="Möchtest du diesen Termin wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          confirmText="Löschen"
          onConfirm={confirmDelete}
          variant="destructive"
          isLoading={deleteMutation.isPending}
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
