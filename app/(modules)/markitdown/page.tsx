'use client';

import { useState } from 'react';
import { FileCode2, Library, Search, Wand2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { MarkitdownKonverter } from '@/components/markitdown/markitdown-konverter';
import { MarkitdownTemplateList } from '@/components/markitdown/markitdown-template-list';
import { MarkitdownTemplateDetailDialog } from '@/components/markitdown/markitdown-template-detail-dialog';
import { useAllTags, useTemplates } from '@/hooks/use-markitdown';
import { cn } from '@/lib/utils';
import type { MarkitdownTemplate } from '@/types';

export default function MarkitdownPage(): React.JSX.Element {
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [suche, setSuche] = useState('');
  const [ausgewaehlt, setAusgewaehlt] = useState<MarkitdownTemplate | null>(null);

  const { data: templates = [], isLoading, error } = useTemplates({
    tags: tagsFilter,
    search: suche,
  });
  const { data: tagInfos = [] } = useAllTags();

  const toggleTag = (tag: string): void => {
    setTagsFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const hatFilter = tagsFilter.length > 0 || suche.trim().length > 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Markitdown"
        description="Dateien (PDF, DOCX, XLSX …) in sauberes Markdown wandeln und als Vorlagen speichern."
      />

      <Tabs defaultValue="konvertieren" className="mt-6">
        <TabsList>
          <TabsTrigger value="konvertieren">
            <Wand2 className="mr-2 h-4 w-4" /> Konvertieren
          </TabsTrigger>
          <TabsTrigger value="bibliothek">
            <Library className="mr-2 h-4 w-4" /> Bibliothek
            {templates.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {templates.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="konvertieren" className="pt-4">
          <MarkitdownKonverter />
        </TabsContent>

        <TabsContent value="bibliothek" className="space-y-4 pt-4">
          {/* Filter */}
          <div className="space-y-3">
            {tagInfos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTagsFilter([])}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    tagsFilter.length === 0
                      ? 'border-black bg-black text-white'
                      : 'border-[#e5e5e5] bg-white text-[#525252] hover:border-[#a3a3a3]',
                  )}
                >
                  Alle
                </button>
                {tagInfos.slice(0, 20).map(({ tag, count }) => {
                  const aktiv = tagsFilter.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        aktiv
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[#e5e5e5] bg-white text-[#525252] hover:border-[#a3a3a3]',
                      )}
                    >
                      {tag} <span className="text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="relative max-w-md">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Titel, Inhalt, Tags, Ersteller…"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Liste */}
          {isLoading ? (
            <LoadingSpinner text="Vorlagen werden geladen…" />
          ) : error ? (
            <ErrorState message="Vorlagen konnten nicht geladen werden" />
          ) : templates.length === 0 ? (
            <EmptyState
              icon={<FileCode2 className="h-10 w-10 text-muted-foreground" />}
              title={hatFilter ? 'Keine Treffer' : 'Noch keine Vorlagen'}
              description={
                hatFilter
                  ? 'Andere Filter ausprobieren oder Suche leeren.'
                  : 'Konvertiere oben eine Datei und speichere das Ergebnis als Vorlage.'
              }
            />
          ) : (
            <MarkitdownTemplateList templates={templates} onSelect={setAusgewaehlt} />
          )}
        </TabsContent>
      </Tabs>

      <MarkitdownTemplateDetailDialog template={ausgewaehlt} onClose={() => setAusgewaehlt(null)} />
    </div>
  );
}
