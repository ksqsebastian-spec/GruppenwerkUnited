'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Eye,
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
import { EmptyState } from '@/components/shared/empty-state';

import { LicenseStatusBadge } from './status-badge';
import { CheckDialog } from './check-dialog';
import { useDriversWithLicenseStatus } from '@/hooks/use-license-control';
import type { DriverWithLicenseStatus, LicenseCheckStatus } from '@/types';

interface EmployeeTableProps {
  /** Optional: Externe Fahrerliste (sonst wird intern geladen) */
  employees?: DriverWithLicenseStatus[];
  /** Optional: Filter anzeigen (Standard: true) */
  showFilters?: boolean;
}

/**
 * Tabelle für Führerscheinkontrolle (basiert auf zentraler Fahrerverwaltung)
 */
export function EmployeeTable({
  employees: externalEmployees,
  showFilters = true,
}: EmployeeTableProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LicenseCheckStatus | 'all'>('all');
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithLicenseStatus | null>(null);

  // Nur intern laden wenn keine externen Daten übergeben wurden
  const { data: internalDrivers = [], isLoading } = useDriversWithLicenseStatus(
    externalEmployees ? undefined : {
      status: 'active',
      search: search || undefined,
      checkStatus: statusFilter !== 'all' ? statusFilter : undefined,
    }
  );

  const drivers = externalEmployees ?? internalDrivers;

  const handleCheckClick = (driver: DriverWithLicenseStatus): void => {
    setSelectedDriver(driver);
    setCheckDialogOpen(true);
  };

  if (!externalEmployees && isLoading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
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
        </div>
      )}

      {drivers.length === 0 ? (
        <EmptyState
          title="Keine Fahrer gefunden"
          description={showFilters
            ? 'Es wurden keine Fahrer mit den ausgewählten Filtern gefunden.'
            : 'Keine fälligen Kontrollen vorhanden.'
          }
          action={showFilters ? (
            <Button asChild>
              <Link href="/fuhrpark/drivers/new">Fahrer anlegen</Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Führerscheinklasse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nächste Kontrolle</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    {driver.last_name}, {driver.first_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {driver.license_class || '-'}
                  </TableCell>
                  <TableCell>
                    {driver.check_status && (
                      <LicenseStatusBadge status={driver.check_status} />
                    )}
                  </TableCell>
                  <TableCell>
                    {driver.next_check_due
                      ? format(new Date(driver.next_check_due), 'dd.MM.yyyy', { locale: de })
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
                          <Link href={`/fuhrpark/drivers/${driver.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Fahrer anzeigen
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCheckClick(driver)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Kontrolle durchführen
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

      {selectedDriver && (
        <CheckDialog
          open={checkDialogOpen}
          onOpenChange={setCheckDialogOpen}
          driver={selectedDriver}
        />
      )}
    </div>
  );
}
