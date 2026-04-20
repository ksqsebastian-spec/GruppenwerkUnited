'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, X, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { KodierungTable } from '@/components/datenkodierung/kodierung-table';
import { KodierungErstellenDialog } from '@/components/datenkodierung/kodierung-erstellen-dialog';

import { useDatenkodierungen } from '@/hooks/use-datenkodierung';
import { useDebounce } from '@/hooks/use-debounce';
import type { Datenkodierung } from '@/types';

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'tag_asc';

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: 'Neueste zuerst',
  date_asc: 'Älteste zuerst',
  name_asc: 'Name A–Z',
  tag_asc: 'Tag A–Z',
};

function tagColor(tag: string): string {
  const colors = ['#c96442', '#2563eb', '#16a34a', '#7C3AED', '#d97706', '#0891b2'];
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

function sortDaten(daten: Datenkodierung[], sort: SortOption): Datenkodierung[] {
  const copy = [...daten];
  switch (sort) {
    case 'date_desc':
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'date_asc':
      return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case 'name_asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    case 'tag_asc':
      return copy.sort((a, b) => {
        const ta = a.tags?.[0] ?? '';
        const tb = b.tags?.[0] ?? '';
        if (!ta && !tb) return 0;
        if (!ta) return 1;
        if (!tb) return -1;
        return ta.localeCompare(tb, 'de');
      });
  }
}

export default function DatenkodierungPage(): React.JSX.Element {
  const [dialogOffen, setDialogOffen] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [aktiverTag, setAktiverTag] = useState<string | undefined>(undefined);
  const [sortierung, setSortierung] = useState<SortOption>('date_desc');
  const [sortMenuOffen, setSortMenuOffen] = useState(false);
  const debouncedSuche = useDebounce(suchbegriff, 300);

  const { data, isLoading, error, refetch } = useDatenkodierungen(debouncedSuche || undefined);

  // Client-side tag filter + sort
  const verarbeiteteDaten = useMemo(() => {
    const gefiltert = aktiverTag
      ? (data ?? []).filter((d) => d.tags?.includes(aktiverTag))
      : (data ?? []);
    return sortDaten(gefiltert, sortierung);
  }, [data, aktiverTag, sortierung]);

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

        {/* Sortierung */}
        <div className="relative">
          <button
            onClick={() => setSortMenuOffen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            {SORT_LABELS[sortierung]}
          </button>
          {sortMenuOffen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortMenuOffen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSortierung(key); setSortMenuOffen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${sortierung === key ? 'font-semibold text-foreground bg-muted/50' : 'text-foreground/80'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Aktiver Tag-Filter */}
        {aktiverTag && (
          <button
            onClick={() => setAktiverTag(undefined)}
            className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: tagColor(aktiverTag) }}
            title="Filter entfernen"
          >
            {aktiverTag}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Ergebnisanzahl */}
      {verarbeiteteDaten.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {verarbeiteteDaten.length} {verarbeiteteDaten.length === 1 ? 'Datensatz' : 'Datensätze'}{aktiverTag ? ` mit Tag „${aktiverTag}"` : ''} gefunden
        </p>
      )}

      <KodierungTable
        daten={verarbeiteteDaten}
        onNeuErstellen={handleNeuErstellen}
        activeTag={aktiverTag}
        onTagFilter={handleTagFilter}
      />

      <KodierungErstellenDialog open={dialogOffen} onOpenChange={setDialogOffen} />
    </div>
  );
}
