'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Receipt,
  Pencil,
  Trash2,
  Car,
  Calendar,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCost, useDeleteCost } from '@/hooks/use-costs';
import { supabase } from '@/lib/supabase/client';

/**
 * Formatiert einen Euro-Betrag
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatiert Kilometerstand
 */
function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('de-DE').format(mileage) + ' km';
}

/**
 * Kosteneintrag-Detailseite
 */
export default function CostDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const costId = params.id as string;

  const { data: cost, isLoading, error, refetch } = useCost(costId);
  const deleteMutation = useDeleteCost();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const confirmDelete = async (): Promise<void> => {
    await deleteMutation.mutateAsync(costId);
    setDeleteDialogOpen(false);
    router.push('/costs');
  };

  /**
   * Öffnet den Beleg in einem neuen Tab
   */
  const handleOpenReceipt = async (): Promise<void> => {
    if (!cost?.receipt_path) return;

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(cost.receipt_path, 3600);

    if (error) {
      console.error('Fehler beim Erstellen der URL:', error);
      return;
    }

    window.open(data.signedUrl, '_blank');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner text="Kosteneintrag wird geladen..." />
      </AppLayout>
    );
  }

  if (error || !cost) {
    return (
      <AppLayout>
        <ErrorState
          message="Kosteneintrag konnte nicht geladen werden"
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
          <PageHeader
            title={cost.cost_type?.name ?? 'Kosteneintrag'}
            description={`${formatCurrency(cost.amount)} am ${format(new Date(cost.date), 'dd.MM.yyyy', { locale: de })}`}
            backHref="/costs"
          />

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/costs/${cost.id}/edit`}>
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
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Betrag</p>
                  <p className="text-lg font-semibold">{formatCurrency(cost.amount)}</p>
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
                    {format(new Date(cost.date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fahrzeug</p>
                  <Link
                    href={`/vehicles/${cost.vehicle_id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {cost.vehicle?.license_plate ?? '-'}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  {cost.cost_type?.icon ?? '📦'}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kostenart</p>
                  <p className="text-sm font-medium">
                    {cost.cost_type?.name ?? '-'}
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
              <DetailRow label="Kennzeichen" value={cost.vehicle?.license_plate ?? '-'} />
              <DetailRow
                label="Fahrzeug"
                value={
                  cost.vehicle
                    ? `${cost.vehicle.brand} ${cost.vehicle.model}`
                    : '-'
                }
              />
              {cost.mileage_at_cost && (
                <DetailRow
                  label="Kilometerstand"
                  value={formatMileage(cost.mileage_at_cost)}
                />
              )}
            </CardContent>
          </Card>

          {/* Kosten-Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kosten-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Betrag" value={formatCurrency(cost.amount)} />
              <DetailRow
                label="Datum"
                value={format(new Date(cost.date), 'dd.MM.yyyy', { locale: de })}
              />
              <DetailRow label="Kostenart" value={cost.cost_type?.name ?? '-'} />
              {cost.description && (
                <DetailRow label="Beschreibung" value={cost.description} />
              )}
            </CardContent>
          </Card>

          {/* Beleg */}
          {cost.receipt_path && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Beleg
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleOpenReceipt}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Beleg öffnen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notizen */}
          <Card className={cost.receipt_path ? '' : 'md:col-span-2'}>
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {cost.notes ?? 'Keine Notizen vorhanden.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Löschen Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Kosteneintrag löschen"
          description="Möchtest du diesen Kosteneintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          confirmText="Löschen"
          onConfirm={confirmDelete}
          variant="destructive"
          isLoading={deleteMutation.isPending}
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
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
