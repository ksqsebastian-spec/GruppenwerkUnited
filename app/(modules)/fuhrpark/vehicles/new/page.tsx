'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { VehicleForm } from '@/components/vehicles';

/**
 * Seite zum Anlegen eines neuen Fahrzeugs
 */
export default function NewVehiclePage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Neues Fahrzeug"
          description="Füge ein neues Fahrzeug zu deinem Fuhrpark hinzu"
          backHref="/fuhrpark/vehicles"
        />

        <VehicleForm />
      </div>
    </AppLayout>
  );
}
