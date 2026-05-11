'use client';

import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { EmployeeTable, BatchCheckDialog } from '@/components/license-control';
import { useLicenseEmployees } from '@/hooks/use-license-control';

/**
 * Führerscheinkontrolle - Mitarbeiterliste
 */
export default function LicenseEmployeesPage(): React.JSX.Element {
  const { data: employees, isLoading, error, refetch } = useLicenseEmployees();

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Mitarbeiter"
          description="Alle Mitarbeiter für die Führerscheinkontrolle"
          backHref="/fuhrpark/license-control"
        >
          <div className="flex items-center gap-2">
            <BatchCheckDialog />
            <Button asChild>
              <Link href="/fuhrpark/license-control/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Neuer Mitarbeiter
              </Link>
            </Button>
          </div>
        </PageHeader>

        {/* Inhalt */}
        {isLoading ? (
          <LoadingSpinner text="Mitarbeiter werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Mitarbeiter konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !employees || employees.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12 text-muted-foreground" />}
            title="Keine Mitarbeiter gefunden"
            description="Lege deinen ersten Mitarbeiter an, um mit der Führerscheinkontrolle zu beginnen."
            action={
              <Button asChild>
                <Link href="/fuhrpark/license-control/employees/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Mitarbeiter anlegen
                </Link>
              </Button>
            }
          />
        ) : (
          <EmployeeTable employees={employees} />
        )}
      </div>
    </>
  );
}
