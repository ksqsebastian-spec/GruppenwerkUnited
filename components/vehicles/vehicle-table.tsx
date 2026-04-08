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
  Car,
  AlertTriangle,
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
import { useArchiveVehicle, useDeleteVehicle } from '@/hooks/use-vehicles';
import type { Vehicle } from '@/types';

interface VehicleTableProps {
  /** Liste der anzuzeigenden Fahrzeuge */
  vehicles: Vehicle[];
}

/**
 * Mappt Kraftstofftypen auf deutsche Bezeichnungen
 */
const fuelTypeLabels: Record<string, string> = {
  diesel: 'Diesel',
  benzin: 'Benzin',
  elektro: 'Elektro',
  hybrid_benzin: 'Hybrid (Benzin)',
  hybrid_diesel: 'Hybrid (Diesel)',
  gas: 'Gas',
};

/**
 * Formatiert den Kilometerstand
 */
function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('de-DE').format(mileage) + ' km';
}

/**
 * Tabelle zur Anzeige von Fahrzeugen
 */
export function VehicleTable({ vehicles }: VehicleTableProps): JSX.Element {
  const router = useRouter();
  const archiveMutation = useArchiveVehicle();
  const deleteMutation = useDeleteVehicle();

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleArchive = (vehicle: Vehicle): void => {
    setSelectedVehicle(vehicle);
    setArchiveDialogOpen(true);
  };

  const handleDelete = (vehicle: Vehicle): void => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmArchive = async (): Promise<void> => {
    if (selectedVehicle) {
      await archiveMutation.mutateAsync(selectedVehicle.id);
      setArchiveDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedVehicle) {
      await deleteMutation.mutateAsync(selectedVehicle.id);
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  /**
   * Prüft ob TÜV überfällig oder bald fällig ist
   */
  const getTuvStatus = (tuvDate: string | null): 'ok' | 'warning' | 'overdue' => {
    if (!tuvDate) return 'ok';
    const due = new Date(tuvDate);
    const now = new Date();
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 30) return 'warning';
    return 'ok';
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kennzeichen</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Kilometerstand</TableHead>
              <TableHead>Kraftstoff</TableHead>
              <TableHead>TÜV</TableHead>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => {
              const tuvStatus = getTuvStatus(vehicle.tuv_due_date);

              return (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/fuhrpark/vehicles/${vehicle.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {vehicle.license_plate}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {vehicle.brand} {vehicle.model}
                    <span className="text-muted-foreground ml-2">
                      ({vehicle.year})
                    </span>
                  </TableCell>
                  <TableCell>{vehicle.company?.name ?? '-'}</TableCell>
                  <TableCell>{formatMileage(vehicle.mileage)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {fuelTypeLabels[vehicle.fuel_type] ?? vehicle.fuel_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.tuv_due_date ? (
                      <div className="flex items-center gap-2">
                        {tuvStatus !== 'ok' && (
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              tuvStatus === 'overdue'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          />
                        )}
                        <span
                          className={
                            tuvStatus === 'overdue'
                              ? 'text-red-600 font-medium'
                              : tuvStatus === 'warning'
                              ? 'text-yellow-600'
                              : ''
                          }
                        >
                          {format(new Date(vehicle.tuv_due_date), 'MM/yyyy', {
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
                          onClick={() => router.push(`/fuhrpark/vehicles/${vehicle.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/fuhrpark/vehicles/${vehicle.id}/edit`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(vehicle)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archivieren
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(vehicle)}
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

      {/* Archivieren Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Fahrzeug archivieren"
        description={`Möchtest du das Fahrzeug "${selectedVehicle?.license_plate}" wirklich archivieren? Es wird nicht mehr in der aktiven Liste angezeigt.`}
        confirmText="Archivieren"
        onConfirm={confirmArchive}
        isLoading={archiveMutation.isPending}
      />

      {/* Löschen Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Fahrzeug löschen"
        description={`Möchtest du das Fahrzeug "${selectedVehicle?.license_plate}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
