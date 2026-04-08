'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle, XCircle, Trash2, FileText, Paperclip, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useLicenseChecks, useDeleteLicenseCheck } from '@/hooks/use-license-control';
import { getDocumentUrl } from '@/hooks/use-documents';
import type { LicenseCheck } from '@/types';

interface CheckHistoryProps {
  employeeId: string;
}

/**
 * Zeigt die Historie aller Führerscheinkontrollen eines Mitarbeiters
 */
export function CheckHistory({ employeeId }: CheckHistoryProps): React.JSX.Element {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkToDelete, setCheckToDelete] = useState<LicenseCheck | null>(null);

  const { data: checks = [], isLoading } = useLicenseChecks(employeeId);
  const deleteMutation = useDeleteLicenseCheck();

  const handleDeleteClick = (check: LicenseCheck): void => {
    setCheckToDelete(check);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (checkToDelete) {
      await deleteMutation.mutateAsync({
        id: checkToDelete.id,
        employeeId,
      });
      setDeleteDialogOpen(false);
      setCheckToDelete(null);
    }
  };

  const handleDocumentClick = async (filePath: string): Promise<void> => {
    const url = await getDocumentUrl(filePath);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="border rounded-lg">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12 text-muted-foreground" />}
        title="Keine Kontrollen vorhanden"
        description="Für diesen Mitarbeiter wurden noch keine Führerscheinkontrollen durchgeführt."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Kontroll-Historie</h3>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Prüfer</TableHead>
              <TableHead>Original vorgelegt</TableHead>
              <TableHead>Nächste Kontrolle</TableHead>
              <TableHead>Dokument</TableHead>
              <TableHead>Notizen</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check) => {
              const hasDocuments = check.documents && check.documents.length > 0;
              const firstDoc = hasDocuments ? check.documents![0] : null;

              return (
                <TableRow key={check.id}>
                  <TableCell className="font-medium">
                    {format(new Date(check.check_date), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>{check.checked_by?.name || '-'}</TableCell>
                  <TableCell>
                    {check.license_verified ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Ja
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        <XCircle className="mr-1 h-3 w-3" />
                        Nein
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(check.next_check_due), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {hasDocuments && firstDoc ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleDocumentClick(firstDoc.file_path)}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{firstDoc.name}</p>
                            <p className="text-xs text-muted-foreground">Klicken zum Öffnen</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {check.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(check)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kontrolle löschen"
        description={`Möchtest du die Kontrolle vom ${
          checkToDelete
            ? format(new Date(checkToDelete.check_date), 'dd.MM.yyyy', { locale: de })
            : ''
        } wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        onConfirm={handleDeleteConfirm}
        destructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
