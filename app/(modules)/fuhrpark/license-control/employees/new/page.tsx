'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { EmployeeForm } from '@/components/license-control';

/**
 * Seite zum Anlegen eines neuen Mitarbeiters für Führerscheinkontrolle
 */
export default function NewLicenseEmployeePage(): React.JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Neuer Mitarbeiter"
          description="Füge einen neuen Mitarbeiter für die Führerscheinkontrolle hinzu"
          backHref="/fuhrpark/license-control/employees"
        />

        <EmployeeForm />
      </div>
    </AppLayout>
  );
}
