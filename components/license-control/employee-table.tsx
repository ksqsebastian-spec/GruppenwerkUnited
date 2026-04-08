'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  ClipboardCheck,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';

import { LicenseStatusBadge } from './status-badge';
import { CheckDialog } from './check-dialog';
import {
  useLicenseEmployees,
  useArchiveLicenseEmployee,
} from '@/hooks/use-license-control';
import { useCompanies } from '@/hooks/use-companies';
import type { LicenseCheckEmployee, LicenseCheckStatus } from '@/types';

interface EmployeeTableProps {
  /** Optional: Externe Mitarbeiterliste (sonst wird intern geladen) */
  employees?: LicenseCheckEmployee[];
  /** Optional: Filter anzeigen (Standard: true) */
  showFilters?: boolean;
}

/**
 * Tabelle für Führerscheinkontrolle-Mitarbeiter
 */
export function EmployeeTable({
  employees: externalEmployees,
  showFilters = true,
}: EmployeeTableProps): JSX.Element {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LicenseCheckStatus | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<LicenseCheckEmployee | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [employeeToArchive, setEmployeeToArchive] = useState<LicenseCheckEmployee | null>(null);

  const { data: companies = [] } = useCompanies();

  // Nur intern laden wenn keine externen Daten übergeben wurden
  const { data: internalEmployees = [], isLoading } = useLicenseEmployees(
    externalEmployees ? undefined : {
      status: 'active',
      search: search || undefined,
      checkStatus: statusFilter !== 'all' ? statusFilter : undefined,
      companyId: companyFilter !== 'all' ? companyFilter : undefined,
    }
  );

  // Verwende externe oder interne Daten
  const employees = externalEmployees ?? internalEmployees;
  const archiveMutation = useArchiveLicenseEmployee();

  const handleCheckClick = (employee: LicenseCheckEmployee): void => {
    setSelectedEmployee(employee);
    setCheckDialogOpen(true);
  };

  const handleArchiveClick = (employee: LicenseCheckEmployee): void => {
    setEmployeeToArchive(employee);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (employeeToArchive) {
      await archiveMutation.mutateAsync(employeeToArchive.id);
      setArchiveDialogOpen(false);
      setEmployeeToArchive(null);
    }
  };

  // Nur Loading anzeigen wenn intern geladen wird
  if (!externalEmployees && isLoading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        )}
        <div className="border rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter - nur anzeigen wenn showFilters true ist */}
      {showFilters && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LicenseCheckStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="overdue">Überfällig</SelectItem>
              <SelectItem value="due_soon">Bald fällig</SelectItem>
              <SelectItem value="ok">In Ordnung</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Firma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Firmen</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tabelle */}
      {employees.length === 0 ? (
        <EmptyState
          title="Keine Mitarbeiter gefunden"
          description={showFilters
            ? "Es wurden keine Mitarbeiter mit den ausgewählten Filtern gefunden."
            : "Keine fälligen Kontrollen vorhanden."
          }
          action={showFilters ? (
            <Button asChild>
              <Link href="/fuhrpark/license-control/employees/new">Mitarbeiter anlegen</Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Personalnummer</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Führerschein</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nächste Kontrolle</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.last_name}, {employee.first_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.personnel_number || '-'}
                  </TableCell>
                  <TableCell>{employee.company?.name || '-'}</TableCell>
                  <TableCell>{employee.license_classes}</TableCell>
                  <TableCell>
                    {employee.check_status && (
                      <LicenseStatusBadge status={employee.check_status} />
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.next_check_due
                      ? format(new Date(employee.next_check_due), 'dd.MM.yyyy', { locale: de })
                      : 'Noch keine Kontrolle'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menü öffnen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/fuhrpark/license-control/employees/${employee.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Anzeigen
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/fuhrpark/license-control/employees/${employee.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCheckClick(employee)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Kontrolle durchführen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleArchiveClick(employee)}
                          className="text-red-600"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archivieren
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Check Dialog */}
      {selectedEmployee && (
        <CheckDialog
          open={checkDialogOpen}
          onOpenChange={setCheckDialogOpen}
          employee={selectedEmployee}
        />
      )}

      {/* Archive Confirmation */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Mitarbeiter archivieren"
        description={`Möchtest du "${employeeToArchive?.first_name} ${employeeToArchive?.last_name}" wirklich archivieren? Der Mitarbeiter wird nicht mehr in der Liste angezeigt.`}
        confirmText="Archivieren"
        onConfirm={handleArchiveConfirm}
        destructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
