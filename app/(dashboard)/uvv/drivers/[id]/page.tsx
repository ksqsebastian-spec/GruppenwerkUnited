'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ClipboardCheck, FileText, Building2, Mail, Phone } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  UvvStatusBadge,
  UvvCheckDialog,
  UvvCheckHistory,
  GeneratePdfButton,
} from '@/components/uvv-control';
import { useDriverWithUvvStatus } from '@/hooks/use-uvv-control';

/**
 * UVV-Fahrerdetail Seite
 */
export default function UvvDriverDetailPage(): JSX.Element {
  const params = useParams();
  const driverId = params.id as string;
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);

  const { data: driver, isLoading, error } = useDriverWithUvvStatus(driverId);

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner text="Fahrer wird geladen..." />
      </AppLayout>
    );
  }

  if (error || !driver) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold">Fahrer nicht gefunden</h2>
          <p className="text-muted-foreground">
            Der angeforderte Fahrer existiert nicht oder wurde gelöscht.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={`${driver.first_name} ${driver.last_name}`}
          description="UVV-Unterweisungen verwalten"
          backHref="/uvv"
          actions={
            <div className="flex gap-2">
              <GeneratePdfButton driver={driver} variant="outline" />
              <Button onClick={() => setCheckDialogOpen(true)}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Unterweisung durchführen
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Fahrer-Informationen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fahrer-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {driver.company?.name ?? 'Keine Firma zugeordnet'}
                </span>
              </div>
              {driver.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{driver.email}</span>
                </div>
              )}
              {driver.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{driver.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* UVV-Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">UVV-Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {driver.uvv_status && (
                  <UvvStatusBadge status={driver.uvv_status} />
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nächste Fälligkeit</span>
                <span className="text-sm font-medium">
                  {driver.next_uvv_due
                    ? format(new Date(driver.next_uvv_due), 'dd.MM.yyyy', { locale: de })
                    : 'Noch nie unterwiesen'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Letzte Unterweisung</span>
                <span className="text-sm font-medium">
                  {driver.latest_uvv_check?.check_date
                    ? format(
                        new Date(driver.latest_uvv_check.check_date),
                        'dd.MM.yyyy',
                        { locale: de }
                      )
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Letzte Unterweisung Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Letzte Unterweisung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driver.latest_uvv_check ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unterweisender</span>
                    <span className="text-sm font-medium">
                      {driver.latest_uvv_check.instructed_by?.name ?? '-'}
                    </span>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Themen</span>
                    <p className="text-sm mt-1">
                      {driver.latest_uvv_check.topics ?? 'Keine Themen dokumentiert'}
                    </p>
                  </div>
                  {driver.latest_uvv_check.notes && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm text-muted-foreground">Notizen</span>
                        <p className="text-sm mt-1">{driver.latest_uvv_check.notes}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Noch keine Unterweisung dokumentiert.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historie */}
        <Card>
          <CardHeader>
            <CardTitle>Unterweisungs-Historie</CardTitle>
            <CardDescription>
              Alle durchgeführten UVV-Unterweisungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UvvCheckHistory driverId={driverId} />
          </CardContent>
        </Card>
      </div>

      {/* Unterweisung durchführen Dialog */}
      {checkDialogOpen && (
        <UvvCheckDialog
          driver={driver}
          open={checkDialogOpen}
          onOpenChange={setCheckDialogOpen}
        />
      )}
    </AppLayout>
  );
}
