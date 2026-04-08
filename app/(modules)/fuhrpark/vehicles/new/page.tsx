'use client';

import { PageHeader } from '@/components/shared/page-header';
import { VehicleForm } from '@/components/vehicles';

/**
 * Seite zum Anlegen eines neuen Fahrzeugs
 */
export default function NewVehiclePage(): React.JSX.Element {
  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Neues Fahrzeug"
          description="Füge ein neues Fahrzeug zu deinem Fuhrpark hinzu"
          backHref="/fuhrpark/vehicles"
        />

        <VehicleForm />
      </div>
    </>
  );
}
