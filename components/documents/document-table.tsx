'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreHorizontal,
  Trash2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  ArrowUpDown,
  Car,
  AlertTriangle,
  Calendar,
  Users,
  Contact,
  ClipboardCheck,
  Shield,
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
import type { Document, DocumentEntityType, DocumentSortField, SortDirection } from '@/types';

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
 * Formatiert die Dateigröße
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Icon für Entity-Typ
 */
function getEntityIcon(entityType: DocumentEntityType): React.JSX.Element {
  switch (entityType) {
    case 'vehicle':
      return <Car className="h-4 w-4" />;
    case 'damage':
      return <AlertTriangle className="h-4 w-4" />;
    case 'appointment':
      return <Calendar className="h-4 w-4" />;
    case 'driver':
      return <Users className="h-4 w-4" />;
    case 'license_check_employee':
      return <Contact className="h-4 w-4" />;
    case 'license_check':
      return <ClipboardCheck className="h-4 w-4" />;
    case 'uvv_check':
      return <Shield className="h-4 w-4" />;
  }
}

/**
 * Label für Entity-Typ
 */
function getEntityLabel(entityType: DocumentEntityType): string {
  switch (entityType) {
    case 'vehicle':
      return 'Fahrzeug';
    case 'damage':
      return 'Schaden';
    case 'appointment':
      return 'Termin';
    case 'driver':
      return 'Fahrer';
    case 'license_check_employee':
      return 'FS-Mitarbeiter';
    case 'license_check':
      return 'FS-Kontrolle';
    case 'uvv_check':
      return 'UVV-Unterweisung';
  }
}

/**
 * URL zur Entity-Detailseite
 */
function getEntityUrl(doc: Document): string | null {
  switch (doc.entity_type) {
    case 'vehicle':
      return doc.vehicle_id ? `/fuhrpark/vehicles/${doc.vehicle_id}` : null;
    case 'damage':
      return doc.damage_id ? `/fuhrpark/damages/${doc.damage_id}` : null;
    case 'appointment':
      return doc.appointment_id ? `/fuhrpark/appointments/${doc.appointment_id}` : null;
    case 'driver':
      return doc.driver_id ? `/fuhrpark/drivers/${doc.driver_id}` : null;
    case 'license_check_employee':
      return doc.license_check_employee_id ? `/fuhrpark/license-control/employees/${doc.license_check_employee_id}` : null;
    case 'license_check':
      // Kontrolle hat keine eigene Detailseite, Link zum Mitarbeiter
      return doc.license_check?.employee_id ? `/fuhrpark/license-control/employees/${doc.license_check.employee_id}` : null;
    case 'uvv_check':
      // UVV-Kontrolle hat keine eigene Detailseite, Link zum Fahrer
      return doc.uvv_check?.driver_id ? `/fuhrpark/uvv/drivers/${doc.uvv_check.driver_id}` : null;
  }
}

/**
 * Beschreibung der Herkunft
 */
function getEntityDescription(doc: Document): string {
  switch (doc.entity_type) {
    case 'vehicle':
      return doc.vehicle?.license_plate ?? '-';
    case 'damage':
      return doc.damage?.description?.substring(0, 30) ?? '-';
    case 'appointment':
      return doc.appointment?.due_date
        ? format(new Date(doc.appointment.due_date), 'dd.MM.yyyy', { locale: de })
        : '-';
    case 'driver':
      return doc.driver
        ? `${doc.driver.first_name} ${doc.driver.last_name}`
        : '-';
    case 'license_check_employee':
      return doc.license_check_employee
        ? `${doc.license_check_employee.first_name} ${doc.license_check_employee.last_name}`
        : '-';
    case 'license_check':
      return doc.license_check?.check_date
        ? format(new Date(doc.license_check.check_date), 'dd.MM.yyyy', { locale: de })
        : '-';
    case 'uvv_check':
      return doc.uvv_check?.check_date
        ? format(new Date(doc.uvv_check.check_date), 'dd.MM.yyyy', { locale: de })
        : '-';
  }
}

/**
 * Datei-Icon basierend auf MIME-Type
 */
function getFileIcon(mimeType: string): React.JSX.Element {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  return <FileText className="h-5 w-5 text-red-500" />;
}

/**
 * Tabelle zur Anzeige von Dokumenten
 */
export function DocumentTable({
  documents,
  sortField,
  sortDirection,
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
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => onSortChange(field)}
      >
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
            {documents.map((doc) => {
              const entityUrl = getEntityUrl(doc);
              return (
                <TableRow key={doc.id}>
                  <TableCell>{getFileIcon(doc.mime_type)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleOpen(doc)}
                      className="font-medium hover:underline text-left"
                    >
                      {doc.name}
                    </button>
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {doc.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {doc.document_type?.name ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(doc.entity_type)}
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {getEntityLabel(doc.entity_type)}
                        </span>
                        {entityUrl ? (
                          <Link
                            href={entityUrl}
                            className="block text-sm hover:underline"
                          >
                            {getEntityDescription(doc)}
                          </Link>
                        ) : (
                          <span className="block text-sm">
                            {getEntityDescription(doc)}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', {
                      locale: de,
                    })}
                  </TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aktionen öffnen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpen(doc)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Öffnen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" />
                          Herunterladen
                        </DropdownMenuItem>
                        {entityUrl && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={entityUrl}>
                                {getEntityIcon(doc.entity_type)}
                                <span className="ml-2">
                                  Zur {getEntityLabel(doc.entity_type)}
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(doc)}
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
