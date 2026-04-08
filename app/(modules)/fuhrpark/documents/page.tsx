'use client';

import { useState, useMemo } from 'react';
import { Search, FileText, LayoutGrid, Table2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DocumentList,
  DocumentTable,
  DocumentFilters,
  DocumentUploadDialog,
} from '@/components/documents';
import { useAllDocuments } from '@/hooks/use-documents';
import type { DocumentFilters as DocumentFiltersType, DocumentSortField, SortDirection, Document } from '@/types';

/**
 * Sortiert Dokumente nach dem angegebenen Feld
 */
function sortDocuments(
  documents: Document[],
  field: DocumentSortField,
  direction: SortDirection
): Document[] {
  return [...documents].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'de');
        break;
      case 'uploaded_at':
        comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        break;
      case 'entity_type':
        comparison = a.entity_type.localeCompare(b.entity_type);
        break;
      case 'file_size':
        comparison = a.file_size - b.file_size;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Datenablage - Zentrale Dokumentenverwaltung
 */
export default function DocumentsPage(): React.JSX.Element {
  // State für Filter, Suche und Ansicht
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<DocumentSortField>('uploaded_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Kombinierte Filter mit Suche
  const combinedFilters: DocumentFiltersType = useMemo(() => ({
    ...filters,
    search: searchQuery || undefined,
  }), [filters, searchQuery]);

  const { data: documents, isLoading, error, refetch } = useAllDocuments(combinedFilters);

  // Sortierte Dokumente
  const sortedDocuments = useMemo(() => {
    if (!documents) return [];
    return sortDocuments(documents, sortField, sortDirection);
  }, [documents, sortField, sortDirection]);

  /**
   * Handler für Sortieränderung
   */
  const handleSortChange = (field: DocumentSortField): void => {
    if (field === sortField) {
      // Gleiche Spalte: Richtung umkehren
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Neue Spalte: Standardrichtung
      setSortField(field);
      setSortDirection('desc');
    }
  };

  /**
   * Handler für Ansichtswechsel
   */
  const handleViewChange = (value: string): void => {
    if (value === 'table' || value === 'cards') {
      setViewMode(value);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Datenablage"
          description="Zentrale Übersicht aller Dokumente"
        >
          <DocumentUploadDialog />
        </PageHeader>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Suchfeld */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen (Name, Notizen, Kennzeichen, Fahrer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Rechte Seite: Filter und Ansicht */}
          <div className="flex items-center gap-2">
            <DocumentFilters filters={filters} onFiltersChange={setFilters} />

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={handleViewChange}
              className="border rounded-md"
            >
              <ToggleGroupItem value="table" aria-label="Tabellenansicht">
                <Table2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="cards" aria-label="Kartenansicht">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Inhalt */}
        {isLoading ? (
          <LoadingSpinner text="Dokumente werden geladen..." />
        ) : error ? (
          <ErrorState
            message="Dokumente konnten nicht geladen werden"
            onRetry={refetch}
          />
        ) : !sortedDocuments || sortedDocuments.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            title="Keine Dokumente gefunden"
            description={
              searchQuery || Object.keys(filters).length > 0
                ? 'Keine Dokumente entsprechen den aktuellen Filtern.'
                : 'Noch keine Dokumente hochgeladen.'
            }
            action={
              searchQuery || Object.keys(filters).length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({});
                  }}
                >
                  Filter zurücksetzen
                </Button>
              ) : (
                <DocumentUploadDialog
                  trigger={
                    <Button>Erstes Dokument hochladen</Button>
                  }
                />
              )
            }
          />
        ) : viewMode === 'table' ? (
          <DocumentTable
            documents={sortedDocuments}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        ) : (
          <DocumentList documents={sortedDocuments} />
        )}

        {/* Anzahl Ergebnisse */}
        {sortedDocuments && sortedDocuments.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {sortedDocuments.length} {sortedDocuments.length === 1 ? 'Dokument' : 'Dokumente'} gefunden
          </p>
        )}
      </div>
    </>
  );
}
