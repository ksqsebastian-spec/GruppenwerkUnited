'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

        {/* Status-Filter */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatus('active')}
            className={cn(
              status === 'active' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
          >
            Aktiv
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatus('archived')}
            className={cn(
              status === 'archived' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
          >
            Archiviert
          </Button>
        </div>

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
