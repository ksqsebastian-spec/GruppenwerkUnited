'use client';

import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  User,
  Mail,
  CreditCard,
  Calendar,
  FileText,
  ClipboardCheck,
  Hash,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LicenseStatusBadge,
  CheckHistory,
} from '@/components/license-control';
import { useLicenseEmployee } from '@/hooks/use-license-control';

/**
 * Führerscheinkontrolle - Legacy Mitarbeiter-Detailseite (nur Anzeige)
 * Neue Kontrollen werden über die Fahrerverwaltung durchgeführt.
 */
export default function LicenseEmployeeDetailPage(): React.JSX.Element {
  const params = useParams();
  const employeeId = params.id as string;

  const { data: employee, isLoading, error, refetch } = useLicenseEmployee(employeeId);

  if (isLoading) {
    return <LoadingSpinner text="Mitarbeiter wird geladen..." />;
  }

  if (error || !employee) {
    return (
      <ErrorState
        message="Mitarbeiter konnte nicht geladen werden"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-muted-foreground">{employee.company?.name}</p>
        </div>
        {employee.status === 'archived' && (
          <Badge variant="secondary">Archiviert</Badge>
        )}
        {employee.check_status && (
          <LicenseStatusBadge status={employee.check_status} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Personalnummer</p>
                <p className="text-sm font-medium">{employee.personnel_number ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">E-Mail</p>
                <p className="text-sm font-medium">
                  {employee.email ? (
                    <a href={`mailto:${employee.email}`} className="hover:underline">
                      {employee.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Führerscheinklassen</p>
                <p className="text-sm font-medium">{employee.license_classes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nächste Kontrolle</p>
                <p className="text-sm font-medium">
                  {employee.next_check_due
                    ? format(new Date(employee.next_check_due), 'dd.MM.yyyy', { locale: de })
                    : 'Noch keine Kontrolle'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Kontroll-Historie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CheckHistory employeeId={employeeId} />
        </CardContent>
      </Card>

      {employee.notes && (
        <Card>
          <CardHeader>
            <CardTitle>
              <FileText className="mr-2 inline-block h-5 w-5" />
              Notizen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
