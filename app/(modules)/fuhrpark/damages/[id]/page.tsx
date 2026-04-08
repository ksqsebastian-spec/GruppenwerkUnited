'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertTriangle,
  Pencil,
  Trash2,
  Car,
  Calendar,
  MapPin,
  User,
  Receipt,
  Shield,
  FileText,
  Plus,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentList } from '@/components/documents';
import { DocumentUpload } from '@/components/documents/document-upload';
import { useDamage, useUpdateDamageStatus, useDeleteDamage } from '@/hooks/use-damages';
import { useDamageDocuments } from '@/hooks/use-documents';
import type { DamageStatus } from '@/types';

/**
 * Status-Badge Varianten
 */
const statusVariants: Record<DamageStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  reported: 'destructive',
  approved: 'default',
  in_repair: 'secondary',
  completed: 'outline',
};

/**
 * Status-Labels auf Deutsch
 */
const statusLabels: Record<DamageStatus, string> = {
  reported: 'Gemeldet',
  approved: 'Genehmigt',
  in_repair: 'In Reparatur',
  completed: 'Abgeschlossen',
};

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
 * Schaden-Detailseite
 */
export default function DamageDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const damageId = params.id as string;

  const { data: damage, isLoading, error, refetch } = useDamage(damageId);
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useDamageDocuments(damageId);
  const updateStatusMutation = useUpdateDamageStatus();
  const deleteMutation = useDeleteDamage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleStatusChange = async (newStatus: DamageStatus): Promise<void> => {
    await updateStatusMutation.mutateAsync({ id: damageId, status: newStatus });
  };

  const confirmDelete = async (): Promise<void> => {
    await deleteMutation.mutateAsync(damageId);
    setDeleteDialogOpen(false);
    router.push('/fuhrpark/damages');
  };

  if (isLoading) {
    return (
      <>
        <LoadingSpinner text="Schaden wird geladen..." />
      </>
    );
  }

  if (error || !damage) {
    return (
      <>
        <ErrorState
          message="Schaden konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Schaden #{damage.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">
                {damage.vehicle?.license_plate} - {format(new Date(damage.date), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
            <Badge variant={statusVariants[damage.status]}>
              {statusLabels[damage.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={damage.status}
              onValueChange={(value) => handleStatusChange(value as DamageStatus)}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status ändern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reported">Gemeldet</SelectItem>
                <SelectItem value="approved">Genehmigt</SelectItem>
                <SelectItem value="in_repair">In Reparatur</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" asChild>
              <Link href={`/fuhrpark/damages/${damage.id}/edit`}>
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
                    href={`/fuhrpark/vehicles/${damage.vehicle_id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {damage.vehicle?.license_plate ?? '-'}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Datum</p>
                  <p className="text-sm font-medium">
                    {format(new Date(damage.date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Geschätzte Kosten</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(damage.cost_estimate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Versicherung</p>
                  <p className="text-sm font-medium">
                    {damage.insurance_claim ? 'Ja' : 'Nein'}
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
              <CardTitle>Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {damage.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label="Ort"
                value={damage.location ?? '-'}
              />
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label="Gemeldet von"
                value={damage.reported_by}
              />
              <DetailRow
                icon={<Receipt className="h-4 w-4" />}
                label="Tatsächliche Kosten"
                value={formatCurrency(damage.actual_cost)}
              />
              {damage.insurance_claim && damage.insurance_claim_number && (
                <DetailRow
                  icon={<Shield className="h-4 w-4" />}
                  label="Schadensnummer"
                  value={damage.insurance_claim_number}
                />
              )}
            </CardContent>
          </Card>

          {/* Notizen */}
          {damage.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {damage.notes}
                </p>
              </CardContent>
            </Card>
          )}
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
                entityType="damage"
                entityId={damageId}
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
              <p className="text-sm text-muted-foreground">Keine Dokumente vorhanden.</p>
            )}
          </CardContent>
        </Card>

        {/* Löschen Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Schaden löschen"
          description="Möchtest du diesen Schaden wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
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
 * Hilfskomponente für Detail-Zeilen mit Icon
 */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
