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
  Trash2,
  AlertTriangle,
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
import { useDeleteDamage } from '@/hooks/use-damages';
import type { Damage, DamageStatus } from '@/types';

interface DamageTableProps {
  /** Liste der anzuzeigenden Schäden */
  damages: Damage[];
}

/**
 * Status-Badge Varianten
 */
const statusVariants: Record<DamageStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  reported: 'destructive',
  approved: 'default',
  in_repair: 'secondary',
  completed: 'outline',
};

/**
 * Status-Labels auf Deutsch
 */
const statusLabels: Record<DamageStatus, string> = {
  reported: 'Gemeldet',
  approved: 'Genehmigt',
  in_repair: 'In Reparatur',
  completed: 'Abgeschlossen',
};

/**
 * Formatiert einen Euro-Betrag
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Tabelle zur Anzeige von Schäden
 */
export function DamageTable({ damages }: DamageTableProps): JSX.Element {
  const router = useRouter();
  const deleteMutation = useDeleteDamage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<Damage | null>(null);

  const handleDelete = (damage: Damage): void => {
    setSelectedDamage(damage);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedDamage) {
      await deleteMutation.mutateAsync(selectedDamage.id);
      setDeleteDialogOpen(false);
      setSelectedDamage(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Geschätzte Kosten</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Versicherung</TableHead>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {damages.map((damage) => (
              <TableRow key={damage.id}>
                <TableCell>
                  {format(new Date(damage.date), 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell>
                  {damage.vehicle ? (
                    <Link
                      href={`/vehicles/${damage.vehicle.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {damage.vehicle.license_plate}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <Link
                    href={`/damages/${damage.id}`}
                    className="hover:underline flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{damage.description}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  {formatCurrency(damage.cost_estimate)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[damage.status]}>
                    {statusLabels[damage.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {damage.insurance_claim ? (
                    <Badge variant="outline">Versichert</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
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
                        onClick={() => router.push(`/damages/${damage.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/damages/${damage.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(damage)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Löschen Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Schaden löschen"
        description={`Möchtest du den Schaden wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
