'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DamageTable } from '@/components/damages';
import { useDamages } from '@/hooks/use-damages';
import type { DamageStatus } from '@/types';

/**
 * Schadensübersicht - Liste aller Schäden
 */
export default function DamagesPage(): React.JSX.Element {
  const [status, setStatus] = useState<DamageStatus | 'all'>('all');

  const { data: damages, isLoading, error, refetch } = useDamages(
    status === 'all' ? undefined : { status }
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Schäden"
          description="Verwalte alle gemeldeten Schäden"
        >
          <Button asChild>
            <Link href="/fuhrpark/damages/new">
              <Plus className="mr-2 h-4 w-4" />
              Schaden melden
            </Link>
          </Button>
        </PageHeader>

        {/* Filter */}
        <div className="flex gap-4">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as DamageStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="reported">Gemeldet</SelectItem>
              <SelectItem value="approved">Genehmigt</SelectItem>
              <SelectItem value="in_repair">In Reparatur</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inhalt */}
        {isLoading ? (
          <LoadingSpinner text="Schäden werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Schäden konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !damages || damages.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="h-12 w-12 text-muted-foreground" />}
            title="Keine Schäden gefunden"
            description={
              status !== 'all'
                ? 'Keine Schäden entsprechen deinen Filterkriterien.'
                : 'Noch keine Schäden gemeldet.'
            }
            action={
              status === 'all' ? (
                <Button asChild>
                  <Link href="/fuhrpark/damages/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Schaden melden
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setStatus('all')}>
                  Filter zurücksetzen
                </Button>
              )
            }
          />
        ) : (
          <DamageTable damages={damages} />
        )}
      </div>
    </AppLayout>
  );
}
