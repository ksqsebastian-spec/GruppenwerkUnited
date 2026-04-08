'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, isPast, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Pencil,
  CheckCircle,
  Trash2,
  Calendar,
  Car,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useCompleteAppointment, useDeleteAppointment } from '@/hooks/use-appointments';
import type { Appointment } from '@/types';

interface AppointmentTableProps {
  /** Liste der anzuzeigenden Termine */
  appointments: Appointment[];
}

/**
 * Status-Badge Varianten
 */
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'warning'> = {
  pending: 'default',
  warning: 'warning',
  completed: 'secondary',
  overdue: 'destructive',
};

/**
 * Status-Labels auf Deutsch
 */
const statusLabels: Record<string, string> = {
  pending: 'Offen',
  warning: 'Offen',
  completed: 'Erledigt',
  overdue: 'Überfällig',
};

/**
 * Tabelle zur Anzeige von Terminen
 */
export function AppointmentTable({ appointments }: AppointmentTableProps): React.JSX.Element {
  const router = useRouter();
  const completeMutation = useCompleteAppointment();
  const deleteMutation = useDeleteAppointment();

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleComplete = (appointment: Appointment): void => {
    setSelectedAppointment(appointment);
    setCompleteDialogOpen(true);
  };

  const handleDelete = (appointment: Appointment): void => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmComplete = async (): Promise<void> => {
    if (selectedAppointment) {
      await completeMutation.mutateAsync(selectedAppointment.id);
      setCompleteDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedAppointment) {
      await deleteMutation.mutateAsync(selectedAppointment.id);
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  /**
   * Berechnet den tatsächlichen Status basierend auf dem Datum
   * - overdue: Überfällig (rot)
   * - warning: In ≤14 Tagen fällig (orange)
   * - pending: Mehr als 14 Tage (normal)
   */
  const getDisplayStatus = (appointment: Appointment): string => {
    if (appointment.status === 'completed') return 'completed';

    const dueDate = new Date(appointment.due_date);
    const daysUntil = differenceInDays(dueDate, new Date());

    if (isPast(dueDate)) return 'overdue';
    if (daysUntil <= 14) return 'warning';
    return 'pending';
  };

  /**
   * Formatiert die Fälligkeitsanzeige
   */
  const getDueLabel = (dueDate: string, status: string): string => {
    if (status === 'completed') {
      return format(new Date(dueDate), 'dd.MM.yyyy', { locale: de });
    }

    const date = new Date(dueDate);
    const days = differenceInDays(date, new Date());

    if (days < 0) {
      return `${Math.abs(days)} Tag(e) überfällig`;
    } else if (days === 0) {
      return 'Heute fällig';
    } else if (days <= 7) {
      return `In ${days} Tag(en)`;
    }
    return format(date, 'dd.MM.yyyy', { locale: de });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Termin</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Fällig</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notizen</TableHead>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              const displayStatus = getDisplayStatus(appointment);

              return (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/fuhrpark/appointments/${appointment.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {appointment.appointment_type?.name ?? 'Termin'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {appointment.vehicle ? (
                      <Link
                        href={`/fuhrpark/vehicles/${appointment.vehicle.id}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {appointment.vehicle.license_plate}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        displayStatus === 'overdue'
                          ? 'text-red-600 font-medium'
                          : displayStatus === 'warning'
                          ? 'text-orange-600 font-medium'
                          : ''
                      }
                    >
                      {getDueLabel(appointment.due_date, displayStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[displayStatus]}>
                      {statusLabels[displayStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {appointment.notes ?? '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aktionen öffnen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/fuhrpark/appointments/${appointment.id}/edit`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        {displayStatus !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleComplete(appointment)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Als erledigt markieren
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(appointment)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Erledigt Dialog */}
      <ConfirmDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        title="Termin als erledigt markieren"
        description={`Möchtest du den Termin "${selectedAppointment?.appointment_type?.name}" als erledigt markieren?`}
        confirmText="Als erledigt markieren"
        onConfirm={confirmComplete}
        isLoading={completeMutation.isPending}
      />

      {/* Löschen Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Termin löschen"
        description={`Möchtest du den Termin "${selectedAppointment?.appointment_type?.name}" wirklich löschen?`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
