'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { AppointmentForm } from '@/components/appointments';
import type { Appointment } from '@/types';

async function fetchAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`/api/fuhrpark/appointments/${id}`);
  if (!res.ok) throw new Error('Termin konnte nicht geladen werden');
  return res.json() as Promise<Appointment>;
}

/**
 * Inner component that uses params
 */
function EditAppointmentContent(): React.JSX.Element {
  const params = useParams();
  const appointmentId = params.id as string;

  const { data: appointment, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  if (isLoading) {
    return <LoadingSpinner text="Termin wird geladen..." />;
  }

  if (error || !appointment) {
    return (
      <ErrorState
        message="Termin konnte nicht geladen werden"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Termin bearbeiten"
        description={`${appointment.appointment_type?.name ?? 'Termin'} für ${appointment.vehicle?.license_plate ?? 'Fahrzeug'}`}
        backHref="/fuhrpark/appointments"
      />

      <AppointmentForm appointment={appointment} />
    </div>
  );
}

/**
 * Seite zum Bearbeiten eines Termins
 */
export default function EditAppointmentPage(): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<LoadingSpinner text="Termin wird geladen..." />}>
        <EditAppointmentContent />
      </Suspense>
    </>
  );
}
