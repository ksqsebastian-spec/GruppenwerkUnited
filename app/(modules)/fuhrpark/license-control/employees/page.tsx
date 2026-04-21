'use client';

import { Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EmployeeTable, BatchCheckDialog } from '@/components/license-control';
import { useDriversWithLicenseStatus } from '@/hooks/use-license-control';

/**
 * Führerscheinkontrolle - Fahrerliste
 */
export default function LicenseEmployeesPage(): React.JSX.Element {
  const { data: drivers, isLoading, error, refetch } = useDriversWithLicenseStatus();

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Fahrer"
          description="Alle Fahrer für die Führerscheinkontrolle"
          backHref="/fuhrpark/license-control"
        >
          <div className="flex items-center gap-2">
            <BatchCheckDialog />
          </div>
        </PageHeader>

        {isLoading ? (
          <LoadingSpinner text="Fahrer werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Fahrer konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !drivers || drivers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12 text-muted-foreground" />}
            title="Keine Fahrer gefunden"
            description="Lege Fahrer in der zentralen Fahrerverwaltung an."
            action={
              <Button asChild>
                <Link href="/fuhrpark/fahrer/new">
                  Fahrer anlegen
                </Link>
              </Button>
            }
          />
        ) : (
          <EmployeeTable employees={drivers} />
        )}
      </div>
    </>
  );
}
