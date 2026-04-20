'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { KodierungTable } from '@/components/datenkodierung/kodierung-table';
import { KodierungErstellenDialog } from '@/components/datenkodierung/kodierung-erstellen-dialog';

import { useDatenkodierungen } from '@/hooks/use-datenkodierung';
import { useDebounce } from '@/hooks/use-debounce';

function tagColor(tag: string): string {
  const colors = ['#c96442', '#2563eb', '#16a34a', '#7C3AED', '#d97706', '#0891b2'];
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

export default function DatenkodierungPage(): React.JSX.Element {
  const [dialogOffen, setDialogOffen] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [aktiverTag, setAktiverTag] = useState<string | undefined>(undefined);
  const debouncedSuche = useDebounce(suchbegriff, 300);

  const { data, isLoading, error, refetch } = useDatenkodierungen(
    debouncedSuche || undefined,
    aktiverTag,
  );

  const handleNeuErstellen = useCallback((): void => {
    setDialogOffen(true);
  }, []);

  const handleTagFilter = useCallback((tag: string): void => {
    setAktiverTag((prev) => (prev === tag ? undefined : tag));
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Datensätze werden geladen..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Datensätze konnten nicht geladen werden'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Datenkodierung"
        description="Kundendaten pseudonymisieren – nur den Code mit KI-Systemen teilen"
        actions={
          <Button onClick={handleNeuErstellen}>
            <Plus className="mr-2 h-4 w-4" />
            Neuen Datensatz kodieren
          </Button>
        }
      />

      {/* Filter-Leiste */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Code, Name oder Adresse suchen..."
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
            className="pl-9"
          />
        </div>

        {aktiverTag && (
          <button
            onClick={() => setAktiverTag(undefined)}
            className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: tagColor(aktiverTag) }}
            title="Filter entfernen"
          >
            Tag: {aktiverTag}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Ergebnisanzahl */}
      {data && data.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'Datensatz' : 'Datensätze'} gefunden
        </p>
      )}

      <KodierungTable
        daten={data ?? []}
        onNeuErstellen={handleNeuErstellen}
        activeTag={aktiverTag}
        onTagFilter={handleTagFilter}
      />

      <KodierungErstellenDialog open={dialogOffen} onOpenChange={setDialogOffen} />
    </div>
  );
}
