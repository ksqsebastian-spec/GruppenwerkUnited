'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useDeleteDocument, getDocumentUrl } from '@/hooks/use-documents';
import type { Document, DocumentSortField, SortDirection } from '@/types';
import { DocumentTableRow } from './document-table-row';

interface DocumentTableProps {
  /** Liste der anzuzeigenden Dokumente */
  documents: Document[];
  /** Aktuelles Sortierfeld */
  sortField: DocumentSortField;
  /** Sortierrichtung */
  sortDirection: SortDirection;
  /** Callback für Sortieränderung */
  onSortChange: (field: DocumentSortField) => void;
}

/**
 * Tabelle zur Anzeige von Dokumenten
 */
export function DocumentTable({
  documents,
  sortField: _sortField,
  sortDirection: _sortDirection,
  onSortChange,
}: DocumentTableProps): React.JSX.Element {
  const deleteMutation = useDeleteDocument();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const handleDelete = (doc: Document): void => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedDocument) {
      await deleteMutation.mutateAsync(selectedDocument.id);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleOpen = async (doc: Document): Promise<void> => {
    const url = await getDocumentUrl(doc.file_path);
    window.open(url, '_blank');
  };

  const handleDownload = async (doc: Document): Promise<void> => {
    const url = await getDocumentUrl(doc.file_path);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: DocumentSortField;
    children: React.ReactNode;
  }): React.JSX.Element => (
    <TableHead>
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSortChange(field)}>
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <SortableHeader field="name">Name</SortableHeader>
              <TableHead>Typ</TableHead>
              <SortableHeader field="entity_type">Herkunft</SortableHeader>
              <SortableHeader field="uploaded_at">Hochgeladen</SortableHeader>
              <SortableHeader field="file_size">Größe</SortableHeader>
              <TableHead className="w-[70px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <DocumentTableRow
                key={doc.id}
                doc={doc}
                onOpen={handleOpen}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

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
