'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MoreHorizontal, Eye, FileText, ClipboardCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { UvvStatusBadge } from './uvv-status-badge';
import { UvvCheckDialog } from './uvv-check-dialog';
import { GeneratePdfButton } from './generate-pdf-button';
import { useDriversWithUvvStatus } from '@/hooks/use-uvv-control';
import { useCompanies } from '@/hooks/use-companies';
import { Skeleton } from '@/components/ui/skeleton';
import type { DriverWithUvvStatus, UvvCheckStatus } from '@/types';

interface DriverUvvTableProps {
  /** Externe Daten (optional, für Dashboard) */
  externalData?: DriverWithUvvStatus[];
  /** Filter nur auf bestimmte Status */
  filterStatus?: UvvCheckStatus[];
  /** Suchfilter ausblenden */
  hideFilters?: boolean;
}

/**
 * Tabelle der Fahrer mit UVV-Status
 */
export function DriverUvvTable({
  externalData,
  filterStatus,
  hideFilters = false,
}: DriverUvvTableProps): JSX.Element {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkingDriver, setCheckingDriver] = useState<DriverWithUvvStatus | null>(null);

  const { data: companies } = useCompanies();
  const { data: drivers, isLoading } = useDriversWithUvvStatus(
    externalData
      ? undefined
      : {
          status: 'active',
          companyId: companyFilter !== 'all' ? companyFilter : undefined,
          search: search || undefined,
          uvvStatus:
            statusFilter !== 'all' ? (statusFilter as UvvCheckStatus) : undefined,
        }
  );

  // Verwende externe Daten falls vorhanden
  let displayData = externalData ?? drivers ?? [];

  // Filter nach Status falls angegeben
  if (filterStatus && filterStatus.length > 0) {
    displayData = displayData.filter(
      (d) => d.uvv_status && filterStatus.includes(d.uvv_status)
    );
  }

  if (isLoading && !externalData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      {!hideFilters && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Input
            placeholder="Suchen nach Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-xs"
          />
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Alle Firmen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Firmen</SelectItem>
              {companies?.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Alle Status" />
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

      {/* Tabelle */}
      {displayData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {filterStatus
            ? 'Keine Fahrer mit diesem Status gefunden.'
            : 'Keine Fahrer gefunden.'}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nächste Unterweisung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    {driver.first_name} {driver.last_name}
                  </TableCell>
                  <TableCell>{driver.company?.name ?? '-'}</TableCell>
                  <TableCell>
                    {driver.uvv_status && (
                      <UvvStatusBadge status={driver.uvv_status} />
                    )}
                  </TableCell>
                  <TableCell>
                    {driver.next_uvv_due
                      ? format(new Date(driver.next_uvv_due), 'dd.MM.yyyy', {
                          locale: de,
                        })
                      : 'Noch nie unterwiesen'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCheckingDriver(driver)}
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Unterweisen
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Aktionen</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/uvv/drivers/${driver.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Details ansehen
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              // PDF generieren
                              const { generateUvvInstructionPdf } =
                                require('@/lib/pdf/uvv-instruction');
                              const { fetchUvvSettings } =
                                require('@/lib/database/uvv-control');
                              fetchUvvSettings().then((settings: any) => {
                                generateUvvInstructionPdf({ driver, settings });
                              });
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PDF erstellen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Check Dialog */}
      {checkingDriver && (
        <UvvCheckDialog
          driver={checkingDriver}
          open={!!checkingDriver}
          onOpenChange={(open) => !open && setCheckingDriver(null)}
        />
      )}
    </div>
  );
}
