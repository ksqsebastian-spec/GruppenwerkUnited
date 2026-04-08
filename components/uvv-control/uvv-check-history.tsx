'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileText, Trash2, ExternalLink, Download, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUvvChecks, useDeleteUvvCheck } from '@/hooks/use-uvv-control';
import { getDocumentUrl } from '@/hooks/use-documents';
import type { UvvCheck, Document } from '@/types';

interface UvvCheckHistoryProps {
  /** ID des Fahrers */
  driverId: string;
}

/**
 * Zeigt die Historie aller UVV-Unterweisungen eines Fahrers
 */
export function UvvCheckHistory({ driverId }: UvvCheckHistoryProps): React.JSX.Element {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<UvvCheck | null>(null);

  const { data: checks, isLoading } = useUvvChecks(driverId);
  const deleteMutation = useDeleteUvvCheck();

  const handleDelete = (check: UvvCheck): void => {
    setSelectedCheck(check);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedCheck) {
      await deleteMutation.mutateAsync(selectedCheck.id);
      setDeleteDialogOpen(false);
      setSelectedCheck(null);
    }
  };

  const handleOpenDocument = async (doc: Document): Promise<void> => {
    const url = await getDocumentUrl(doc.file_path);
    window.open(url, '_blank');
  };

  const handleDownloadDocument = async (doc: Document): Promise<void> => {
    const url = await getDocumentUrl(doc.file_path);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!checks || checks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Noch keine Unterweisungen dokumentiert.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Unterweisender</TableHead>
              <TableHead>Themen</TableHead>
              <TableHead>Nächste Fälligkeit</TableHead>
              <TableHead>Dokumente</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check) => (
              <TableRow key={check.id}>
                <TableCell className="font-medium">
                  {format(new Date(check.check_date), 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell>{check.instructed_by?.name ?? '-'}</TableCell>
                <TableCell className="max-w-[200px]">
                  {check.topics ? (
                    <span className="text-sm text-muted-foreground truncate block">
                      {check.topics.substring(0, 50)}
                      {check.topics.length > 50 ? '...' : ''}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(check.next_check_due), 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell>
                  {check.documents && check.documents.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {check.documents.map((doc) => (
                        <Button
                          key={doc.id}
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDocument(doc)}
                          title={doc.name}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Kein Dokument</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Aktionen</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {check.documents && check.documents.length > 0 && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleOpenDocument(check.documents![0])}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Dokument öffnen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadDocument(check.documents![0])}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Dokument herunterladen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(check)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Unterweisung löschen
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
        title="Unterweisung löschen"
        description={`Möchtest du die Unterweisung vom ${
          selectedCheck
            ? format(new Date(selectedCheck.check_date), 'dd.MM.yyyy', { locale: de })
            : ''
        } wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
