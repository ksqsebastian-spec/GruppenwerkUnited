'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { DriverTable } from '@/components/drivers';
import { useDrivers } from '@/hooks/use-drivers';

/**
 * Fahrerübersicht - Liste aller Fahrer
 */
export default function DriversPage(): React.JSX.Element {
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  const { data: drivers, isLoading, error, refetch } = useDrivers({ status });

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Fahrer"
          description="Verwalte alle Fahrer deines Fuhrparks"
        >
          <Button asChild>
            <Link href="/fuhrpark/drivers/new">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Fahrer
            </Link>
          </Button>
        </PageHeader>

        {/* Inhalt */}
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
            description="Lege deinen ersten Fahrer an, um zu beginnen."
            action={
              <Button asChild>
                <Link href="/fuhrpark/drivers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Fahrer anlegen
                </Link>
              </Button>
            }
          />
        ) : (
          <DriverTable drivers={drivers} />
        )}
      </div>
    </>
  );
}
