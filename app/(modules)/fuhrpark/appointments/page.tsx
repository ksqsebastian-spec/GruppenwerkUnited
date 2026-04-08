'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';
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
import { AppointmentTable } from '@/components/appointments';
import { useAppointments } from '@/hooks/use-appointments';
import type { AppointmentStatus } from '@/types';

/**
 * Terminübersicht - Liste aller Termine
 */
export default function AppointmentsPage(): React.JSX.Element {
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');

  const { data: appointments, isLoading, error, refetch } = useAppointments(
    status === 'all' ? undefined : { status }
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Termine"
          description="Verwalte Wartungs- und Prüftermine"
        >
          <Button asChild>
            <Link href="/fuhrpark/appointments/new">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Termin
            </Link>
          </Button>
        </PageHeader>

        {/* Filter */}
        <div className="flex gap-4">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as AppointmentStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="pending">Offen</SelectItem>
              <SelectItem value="completed">Erledigt</SelectItem>
              <SelectItem value="overdue">Überfällig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inhalt */}
        {isLoading ? (
          <LoadingSpinner text="Termine werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Termine konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !appointments || appointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
            title="Keine Termine gefunden"
            description={
              status !== 'all'
                ? 'Keine Termine entsprechen deinen Filterkriterien.'
                : 'Lege deinen ersten Termin an, um zu beginnen.'
            }
            action={
              status === 'all' ? (
                <Button asChild>
                  <Link href="/fuhrpark/appointments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Ersten Termin anlegen
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
          <AppointmentTable appointments={appointments} />
        )}
      </div>
    </AppLayout>
  );
}
