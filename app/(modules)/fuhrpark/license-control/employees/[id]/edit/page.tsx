'use client';

import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmployeeForm } from '@/components/license-control';
import { useLicenseEmployee } from '@/hooks/use-license-control';

/**
 * Seite zum Bearbeiten eines Mitarbeiters für Führerscheinkontrolle
 */
export default function EditLicenseEmployeePage(): React.JSX.Element {
  const params = useParams();
  const employeeId = params.id as string;

  const { data: employee, isLoading, error, refetch } = useLicenseEmployee(employeeId);

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
        <PageHeader
          title="Mitarbeiter bearbeiten"
          description={`${employee.first_name} ${employee.last_name}`}
          backHref={`/fuhrpark/license-control/employees/${employee.id}`}
        />

        <EmployeeForm employee={employee} />
      </div>
    </AppLayout>
  );
}
