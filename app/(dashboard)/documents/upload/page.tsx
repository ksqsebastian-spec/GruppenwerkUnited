'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { DocumentUpload } from '@/components/documents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useDamages } from '@/hooks/use-damages';
import { useAppointments } from '@/hooks/use-appointments';
import type { DocumentEntityType } from '@/types';

/**
 * Entity-Typ Labels für UI
 */
const entityTypeLabels: Record<DocumentEntityType, string> = {
  vehicle: 'Fahrzeug',
  damage: 'Schadensmeldung',
  appointment: 'Termin',
  driver: 'Fahrer',
  license_check_employee: 'FS-Mitarbeiter',
  license_check: 'FS-Kontrolle',
  uvv_check: 'UVV-Unterweisung',
};

/**
 * Wrapper-Komponente für Entity-Auswahl
 */
function DocumentUploadForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-Parameter für Vorauswahl
  const preselectedType = searchParams.get('type') as DocumentEntityType | null;
  const preselectedId = searchParams.get('id');

  const [entityType, setEntityType] = useState<DocumentEntityType | ''>(preselectedType ?? '');
  const [entityId, setEntityId] = useState<string>(preselectedId ?? '');

  // Daten für Entity-Auswahl laden
  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: drivers } = useDrivers({ status: 'active' });
  const { data: damages } = useDamages();
  const { data: appointments } = useAppointments();

  const handleEntityTypeChange = (value: string): void => {
    setEntityType(value as DocumentEntityType);
    setEntityId(''); // Entity-ID zurücksetzen bei Typ-Wechsel
  };

  const handleSuccess = (): void => {
    router.push('/documents');
  };

  // Wenn beide Parameter vorhanden, direkt Upload anzeigen
  if (entityType && entityId) {
    return (
      <DocumentUpload
        entityType={entityType}
        entityId={entityId}
        onSuccess={handleSuccess}
        onCancel={() => {
          // Bei Abbruch: Entity-Auswahl wieder anzeigen
          if (!preselectedType) {
            setEntityType('');
            setEntityId('');
          } else {
            router.back();
          }
        }}
      />
    );
  }

  // Entity-Auswahl anzeigen
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokument zuordnen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Zuordnung *</Label>
          <Select value={entityType} onValueChange={handleEntityTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Worauf bezieht sich das Dokument?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vehicle">Fahrzeug</SelectItem>
              <SelectItem value="damage">Schadensmeldung</SelectItem>
              <SelectItem value="appointment">Termin</SelectItem>
              <SelectItem value="driver">Fahrer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {entityType === 'vehicle' && (
          <div className="space-y-2">
            <Label>Fahrzeug *</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Fahrzeug auswählen" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {entityType === 'damage' && (
          <div className="space-y-2">
            <Label>Schadensmeldung *</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Schadensmeldung auswählen" />
              </SelectTrigger>
              <SelectContent>
                {damages?.map((damage) => (
                  <SelectItem key={damage.id} value={damage.id}>
                    {damage.date} - {damage.description?.substring(0, 50)}
                    {damage.description && damage.description.length > 50 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {entityType === 'appointment' && (
          <div className="space-y-2">
            <Label>Termin *</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Termin auswählen" />
              </SelectTrigger>
              <SelectContent>
                {appointments?.map((appointment) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    {appointment.due_date} - {appointment.appointment_type?.name ?? 'Termin'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {entityType === 'driver' && (
          <div className="space-y-2">
            <Label>Fahrer *</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Fahrer auswählen" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Seite zum Hochladen eines Dokuments
 */
export default function UploadDocumentPage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dokument hochladen"
          description="Lade ein neues Dokument hoch"
          backHref="/documents"
        />

        <Suspense fallback={<LoadingSpinner text="Formular wird geladen..." />}>
          <DocumentUploadForm />
        </Suspense>
      </div>
    </AppLayout>
  );
}
