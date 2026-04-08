'use client';

import { PageHeader } from '@/components/shared/page-header';
import { DriverForm } from '@/components/drivers';

/**
 * Seite zum Anlegen eines neuen Fahrers
 */
export default function NewDriverPage(): React.JSX.Element {
  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Neuer Fahrer"
          description="Füge einen neuen Fahrer hinzu"
          backHref="/fuhrpark/drivers"
        />

        <DriverForm />
      </div>
    </>
  );
}
