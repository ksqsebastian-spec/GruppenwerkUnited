'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Trash2,
  Receipt,
  Car,
  Eye,
  Pencil,
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
import { useDeleteCost } from '@/hooks/use-costs';
import type { Cost } from '@/types';

interface CostTableProps {
  /** Liste der anzuzeigenden Kosten */
  costs: Cost[];
}

/**
 * Formatiert einen Euro-Betrag
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatiert den Kilometerstand
 */
function formatMileage(mileage: number | null | undefined): string {
  if (mileage === null || mileage === undefined) return '-';
  return new Intl.NumberFormat('de-DE').format(mileage) + ' km';
}

/**
 * Tabelle zur Anzeige von Kosten
 */
export function CostTable({ costs }: CostTableProps): React.JSX.Element {
  const router = useRouter();
  const deleteMutation = useDeleteCost();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);

  const handleDelete = (cost: Cost): void => {
    setSelectedCost(cost);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedCost) {
      await deleteMutation.mutateAsync(selectedCost.id);
      setDeleteDialogOpen(false);
      setSelectedCost(null);
    }
  };

  // Summe berechnen
  const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Kostenart</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Kilometerstand</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>
                  <Link
                    href={`/fuhrpark/costs/${cost.id}`}
                    className="hover:underline"
                  >
                    {format(new Date(cost.date), 'dd.MM.yyyy', { locale: de })}
                  </Link>
                </TableCell>
                <TableCell>
                  {cost.vehicle ? (
                    <Link
                      href={`/fuhrpark/vehicles/${cost.vehicle.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {cost.vehicle.license_plate}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <Receipt className="h-3 w-3 mr-1" />
                    {cost.cost_type?.name ?? 'Sonstiges'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {cost.description ?? '-'}
                </TableCell>
                <TableCell>
                  {formatMileage(cost.mileage_at_cost)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(cost.amount)}
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
                        onClick={() => router.push(`/fuhrpark/costs/${cost.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/fuhrpark/costs/${cost.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(cost)}
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
            {/* Summenzeile */}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={5}>Summe</TableCell>
              <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Löschen Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kosteneintrag löschen"
        description="Möchtest du diesen Kosteneintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
