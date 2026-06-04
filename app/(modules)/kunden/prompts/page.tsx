'use client';

import { useState } from 'react';
import { Edit, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { KundenPromptFormDialog } from '@/components/kunden/kunden-prompt-form-dialog';
import { useKundenPrompts, useDeleteKundenPrompt } from '@/hooks/use-kunden';
import type { CustomerPrompt } from '@/types';

export default function KundenPromptsPage(): React.JSX.Element {
  const [neu, setNeu] = useState(false);
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

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Prompt-Vorlagen"
        description="Wiederverwendbare Vorlagen für Rechnung, Mahnung, Angebot etc. — mit Platzhaltern für Kundendaten und Datenkodierungen."
        backHref="/kunden"
        actions={
          <Button onClick={() => setNeu(true)}>
            <Plus className="mr-2 h-4 w-4" /> Neue Vorlage
          </Button>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <LoadingSpinner text="Vorlagen werden geladen…" />
        ) : error ? (
          <ErrorState message="Vorlagen konnten nicht geladen werden" />
        ) : prompts.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-12 w-12 text-muted-foreground" />}
            title="Noch keine Vorlagen"
            description="Lege deine erste Prompt-Vorlage an. Beispiele: Rechnung, Mahnung, Angebot."
            action={
              <Button onClick={() => setNeu(true)}>
                <Plus className="mr-2 h-4 w-4" /> Erste Vorlage anlegen
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {prompts.map((p) => (
              <li key={p.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{p.name}</h3>
                    {p.kategorie && (
                      <Badge variant="outline" className="mt-1">
                        {p.kategorie}
                      </Badge>
                    )}
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
      </div>

      <KundenPromptFormDialog open={neu} onOpenChange={setNeu} />
      <KundenPromptFormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} vorlage={edit} />

      <ConfirmDialog
        open={!!loeschenId}
        onOpenChange={(o) => !o && setLoeschenId(null)}
        title="Vorlage löschen?"
        description="Die Vorlage wird unwiderruflich entfernt."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
