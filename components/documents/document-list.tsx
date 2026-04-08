'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Download,
  Trash2,
  FileText,
  Car,
  ExternalLink,
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
import { useDeleteDocument, getDocumentUrl } from '@/hooks/use-documents';
import type { Document } from '@/types';

interface DocumentListProps {
  /** Liste der anzuzeigenden Dokumente */
  documents: Document[];
}

/**
 * Dokumenttypen-Labels
 */
const documentTypeLabels: Record<string, string> = {
  registration: 'Fahrzeugschein',
  insurance: 'Versicherung',
  tuv: 'TÜV-Bericht',
  service: 'Serviceheft',
  invoice: 'Rechnung',
  contract: 'Vertrag',
  protocol: 'Übergabeprotokoll',
  other: 'Sonstiges',
};

/**
 * Formatiert Dateigröße
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Liste der Dokumente
 */
export function DocumentList({ documents }: DocumentListProps): React.JSX.Element {
  const deleteMutation = useDeleteDocument();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const handleDelete = (document: Document): void => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedDocument) {
      await deleteMutation.mutateAsync(selectedDocument.id);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleDownload = async (document: Document): Promise<void> => {
    try {
      const url = await getDocumentUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Fehler beim Öffnen des Dokuments:', error);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dokument</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Hochgeladen</TableHead>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{document.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {document.vehicle ? (
                    <Link
                      href={`/fuhrpark/vehicles/${document.vehicle.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {document.vehicle.license_plate}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {documentTypeLabels[document.document_type_id] ??
                      document.document_type?.name ??
                      document.document_type_id}
                  </Badge>
                </TableCell>
                <TableCell>{formatFileSize(document.file_size)}</TableCell>
                <TableCell>
                  {format(new Date(document.uploaded_at), 'dd.MM.yyyy', {
                    locale: de,
                  })}
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
                      <DropdownMenuItem onClick={() => handleDownload(document)}>
                        <Download className="mr-2 h-4 w-4" />
                        Herunterladen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(document)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        In neuem Tab öffnen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(document)}
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
        title="Dokument löschen"
        description={`Möchtest du das Dokument "${selectedDocument?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
