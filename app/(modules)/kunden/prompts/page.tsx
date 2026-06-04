'use client';

import { useState } from 'react';
import { Edit, File as FileIcon, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { KundenPromptFormDialog } from '@/components/kunden/kunden-prompt-form-dialog';
import { useKundenPrompts, useDeleteKundenPrompt } from '@/hooks/use-kunden';
import { STARTER_PROMPTS, type StarterPrompt } from '@/lib/kunden/starter-prompts';
import type { CustomerPrompt } from '@/types';

export default function KundenPromptsPage(): React.JSX.Element {
  const [neu, setNeu] = useState(false);
  const [starter, setStarter] = useState<StarterPrompt | null>(null);
  const [edit, setEdit] = useState<CustomerPrompt | null>(null);
  const [loeschenId, setLoeschenId] = useState<string | null>(null);

  const { data: prompts = [], isLoading, error } = useKundenPrompts();
  const remove = useDeleteKundenPrompt();

  const handleConfirmDelete = async (): Promise<void> => {
    if (!loeschenId) return;
    try {
      await remove.mutateAsync(loeschenId);
    } finally {
      setLoeschenId(null);
    }
  };

  const handleStarter = (s: StarterPrompt): void => {
    setStarter(s);
  };

  // Bereits in der Bibliothek vorhandene Schnellstart-Namen (case-insensitiv)
  const vorhandeneNamen = new Set(prompts.map((p) => p.name.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Prompt-Vorlagen"
        description='Pro Anwendungsfall (Rechnung, Mahnung, Angebot …) ein Prompt + optional eine Vorlage-Datei. Beim Generieren werden Kundendaten und Datenkodierungen eingefüllt.'
        backHref="/kunden"
        actions={
          <Button onClick={() => setNeu(true)}>
            <Plus className="mr-2 h-4 w-4" /> Eigene Vorlage
          </Button>
        }
      />

      {/* ── Schnellstart ──────────────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="mb-3 flex items-baseline gap-2">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Schnellstart — typische Anwendungsfälle
          </h2>
        </div>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STARTER_PROMPTS.map((s) => {
            const schonInBibliothek = vorhandeneNamen.has(s.name.toLowerCase());
            return (
              <li
                key={s.name}
                className="flex flex-col rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{s.name}</h3>
                    <Badge variant="outline" className="mt-1">
                      {s.kategorie}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.beschreibung}</p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={schonInBibliothek ? 'outline' : 'default'}
                    onClick={() => handleStarter(s)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {schonInBibliothek ? 'Erneut hinzufügen' : 'Übernehmen'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Eigene Bibliothek ─────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Meine Vorlagen
        </h2>

        {isLoading ? (
          <LoadingSpinner text="Vorlagen werden geladen…" />
        ) : error ? (
          <ErrorState message="Vorlagen konnten nicht geladen werden" />
        ) : prompts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine eigenen Vorlagen. Übernimm oben einen Schnellstart oder lege eine eigene an.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {prompts.map((p) => (
              <li key={p.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{p.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.kategorie && <Badge variant="outline">{p.kategorie}</Badge>}
                      {p.vorlage_dateiname && (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                          <FileIcon className="mr-1 h-3 w-3" />
                          {p.vorlage_dateiname}
                        </Badge>
                      )}
                    </div>
                    {p.beschreibung && (
                      <p className="mt-2 text-sm text-muted-foreground">{p.beschreibung}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEdit(p)} aria-label="Vorlage bearbeiten">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLoeschenId(p.id)}
                      aria-label="Vorlage löschen"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {p.template}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <KundenPromptFormDialog open={neu} onOpenChange={setNeu} />
      <KundenPromptFormDialog
        open={!!starter}
        onOpenChange={(o) => !o && setStarter(null)}
        starter={starter}
      />
      <KundenPromptFormDialog
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        vorlage={edit}
      />

      <ConfirmDialog
        open={!!loeschenId}
        onOpenChange={(o) => !o && setLoeschenId(null)}
        title="Vorlage löschen?"
        description="Die Vorlage und der zugehörige Datei-Anhang werden unwiderruflich entfernt."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
