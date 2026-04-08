'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Archive,
  Trash2,
  User,
  AlertTriangle,
  Mail,
  Phone,
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
import { useArchiveDriver } from '@/hooks/use-drivers';
import type { Driver } from '@/types';

interface DriverTableProps {
  /** Liste der anzuzeigenden Fahrer */
  drivers: Driver[];
}

/**
 * Tabelle zur Anzeige von Fahrern
 */
export function DriverTable({ drivers }: DriverTableProps): JSX.Element {
  const router = useRouter();
  const archiveMutation = useArchiveDriver();

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const handleArchive = (driver: Driver): void => {
    setSelectedDriver(driver);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = async (): Promise<void> => {
    if (selectedDriver) {
      await archiveMutation.mutateAsync(selectedDriver.id);
      setArchiveDialogOpen(false);
      setSelectedDriver(null);
    }
  };

  /**
   * Prüft ob der Führerschein bald abläuft
   */
  const getLicenseStatus = (expiryDate: string | null): 'ok' | 'warning' | 'expired' => {
    if (!expiryDate) return 'ok';
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 90) return 'warning';
    return 'ok';
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Führerschein</TableHead>
              <TableHead>Gültig bis</TableHead>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => {
              const licenseStatus = getLicenseStatus(driver.license_expiry);

              return (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/drivers/${driver.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      {driver.first_name} {driver.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{driver.company?.name ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {driver.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {driver.email}
                        </div>
                      )}
                      {driver.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      )}
                      {!driver.email && !driver.phone && '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.license_class ? (
                      <Badge variant="outline">{driver.license_class}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {driver.license_expiry ? (
                      <div className="flex items-center gap-2">
                        {licenseStatus !== 'ok' && (
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              licenseStatus === 'expired'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          />
                        )}
                        <span
                          className={
                            licenseStatus === 'expired'
                              ? 'text-red-600 font-medium'
                              : licenseStatus === 'warning'
                              ? 'text-yellow-600'
                              : ''
                          }
                        >
                          {format(new Date(driver.license_expiry), 'dd.MM.yyyy', {
                            locale: de,
                          })}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
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
                          onClick={() => router.push(`/drivers/${driver.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/drivers/${driver.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(driver)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archivieren
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

      {/* Archivieren Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Fahrer archivieren"
        description={`Möchtest du den Fahrer "${selectedDriver?.first_name} ${selectedDriver?.last_name}" wirklich archivieren?`}
        confirmText="Archivieren"
        onConfirm={confirmArchive}
        isLoading={archiveMutation.isPending}
      />
    </>
  );
}
