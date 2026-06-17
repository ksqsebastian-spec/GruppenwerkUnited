'use client';

import { useState } from 'react';
import { ImagePlus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { BildUploadDialog } from '@/components/bilder/bild-upload-dialog';
import { BildDetailDialog } from '@/components/bilder/bild-detail-dialog';
import { BilderGrid } from '@/components/bilder/bilder-grid';
import { FirmenFilterChips } from '@/components/bilder/firmen-filter-chips';
import { useBilder, type BildMitUrl } from '@/hooks/use-bilder';

export default function BilderPage(): React.JSX.Element {
  const [neu, setNeu] = useState(false);
  const [ausgewaehlt, setAusgewaehlt] = useState<BildMitUrl | null>(null);
  const [firmenFilter, setFirmenFilter] = useState<string[]>([]);
  const [suche, setSuche] = useState('');

  const { data: bilder = [], isLoading, error } = useBilder({
    firmenTags: firmenFilter,
    search: suche,
  });

  const toggleFirma = (slug: string): void => {
    setFirmenFilter((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Bilder"
        description="Gemeinsame Bibliothek für Webseiten, Social Media & Co. — sichtbar für alle Firmen."
        actions={
          <Button onClick={() => setNeu(true)}>
            <ImagePlus className="mr-2 h-4 w-4" /> Bild hochladen
          </Button>
        }
      />

      {/* Filter */}
      <div className="mt-6 space-y-3">
        <FirmenFilterChips
          ausgewaehlt={firmenFilter}
          onToggle={toggleFirma}
          onReset={() => setFirmenFilter([])}
        />
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Titel, Beschreibung, Uploader…"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isLoading ? (
          <LoadingSpinner text="Bilder werden geladen…" />
        ) : error ? (
          <ErrorState message="Bilder konnten nicht geladen werden" />
        ) : bilder.length === 0 ? (
          <EmptyState
            icon={<ImagePlus className="h-10 w-10 text-muted-foreground" />}
            title={
              firmenFilter.length > 0 || suche.trim().length > 0
                ? 'Keine Treffer'
                : 'Noch keine Bilder'
            }
            description={
              firmenFilter.length > 0 || suche.trim().length > 0
                ? 'Andere Filter ausprobieren oder Suche leeren.'
                : 'Lade das erste Bild hoch — es wird sofort für alle sichtbar.'
            }
            action={
              firmenFilter.length === 0 && suche.trim().length === 0 ? (
                <Button onClick={() => setNeu(true)}>
                  <ImagePlus className="mr-2 h-4 w-4" /> Erstes Bild hochladen
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {bilder.length} {bilder.length === 1 ? 'Bild' : 'Bilder'}
            </p>
            <BilderGrid bilder={bilder} onSelect={setAusgewaehlt} />
          </>
        )}
      </div>

      <BildUploadDialog open={neu} onOpenChange={setNeu} />
      <BildDetailDialog bild={ausgewaehlt} onClose={() => setAusgewaehlt(null)} />
    </div>
  );
}
