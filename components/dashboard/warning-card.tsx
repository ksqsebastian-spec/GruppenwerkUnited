'use client';

import Link from 'next/link';
import { format, isPast, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AppointmentWithVehicle } from '@/types';

interface WarningCardProps {
  /** Liste der Termine die Warnungen auslösen */
  appointments: AppointmentWithVehicle[];
  /** Ob die Daten geladen werden */
  isLoading?: boolean;
}

/**
 * Warnungs-Karte für überfällige und bald fällige Termine
 */
export function WarningCard({
  appointments,
  isLoading = false,
}: WarningCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Warnungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Termine nach Dringlichkeit sortieren (überfällig zuerst)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  const overdueCount = appointments.filter(
    (apt) => isPast(new Date(apt.due_date))
  ).length;

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Keine Warnungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Alle Termine sind im grünen Bereich. Keine überfälligen oder dringenden Termine vorhanden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Warnungen
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {overdueCount} überfällig
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/fuhrpark/appointments">
            Alle anzeigen
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedAppointments.slice(0, 5).map((appointment) => {
          const dueDate = new Date(appointment.due_date);
          const isOverdue = isPast(dueDate);
          const daysUntil = differenceInDays(dueDate, new Date());

          return (
            <Link
              key={appointment.id}
              href={`/fuhrpark/appointments?highlight=${appointment.id}`}
              className={cn(
                'flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-muted/50',
                isOverdue && 'border-red-200 bg-red-50 hover:bg-red-100'
              )}
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {appointment.type} - {appointment.vehicle?.license_plate}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appointment.vehicle?.brand} {appointment.vehicle?.model}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={isOverdue ? 'destructive' : daysUntil <= 7 ? 'warning' : 'secondary'}
                >
                  {isOverdue
                    ? `${Math.abs(daysUntil)} Tage überfällig`
                    : `in ${daysUntil} Tagen`}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(dueDate, 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
