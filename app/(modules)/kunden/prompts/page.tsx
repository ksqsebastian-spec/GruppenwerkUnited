'use client';

import { useState } from 'react';
import { Edit, FileText, FolderOpen, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { KundenPromptFormDialog } from '@/components/kunden/kunden-prompt-form-dialog';
import { KundenPromptWizardDialog } from '@/components/kunden/kunden-prompt-wizard-dialog';
import { DateiVorlagenBibliothek } from '@/components/kunden/datei-vorlagen-bibliothek';
import { useKundenPrompts, useDateiVorlagen, useDeleteKundenPrompt } from '@/hooks/use-kunden';
import type { CustomerPrompt } from '@/types';

export default function KundenPromptsPage(): React.JSX.Element {
  const [wizard, setWizard] = useState(false);
  const [neu, setNeu] = useState(false);
  const [edit, setEdit] = useState<CustomerPrompt | null>(null);
  const [loeschenId, setLoeschenId] = useState<string | null>(null);

  const { data: prompts = [], isLoading, error } = useKundenPrompts();
  const { data: dateiVorlagen = [] } = useDateiVorlagen();
  const remove = useDeleteKundenPrompt();

  // Map id → DateiVorlage für die „Datei"-Badges der Prompts
  const dateiMap = new Map(dateiVorlagen.map((d) => [d.id, d]));

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
        title="Vorlagen-Bibliothek"
        description="Prompt-Vorlagen (was die KI tun soll) und Datei-Vorlagen (Briefpapier etc.) getrennt verwalten. Beim Generieren werden sie kombiniert."
        backHref="/kunden"
      />

      <Tabs defaultValue="prompts" className="mt-6">
        <TabsList>
          <TabsTrigger value="prompts">
            <Sparkles className="mr-2 h-4 w-4" /> Prompt-Vorlagen
          </TabsTrigger>
          <TabsTrigger value="dateien">
            <FolderOpen className="mr-2 h-4 w-4" /> Datei-Vorlagen
          </TabsTrigger>
        </TabsList>

        {/* ── Prompt-Vorlagen ──────────────────────────────────────────────── */}
        <TabsContent value="prompts" className="pt-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Pro Anwendungsfall (Rechnung, Mahnung, Angebot …) ein Anweisungs-Text + verknüpfte
              Datei.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setNeu(true)}>
                <Plus className="mr-2 h-4 w-4" /> Leer anlegen
              </Button>
              <Button onClick={() => setWizard(true)}>
                <Wand2 className="mr-2 h-4 w-4" /> Geführt anlegen
              </Button>
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Vorlagen werden geladen…" />
          ) : error ? (
            <ErrorState message="Vorlagen konnten nicht geladen werden" />
          ) : prompts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Hier erscheint deine Vorlagen-Bibliothek. Beim ersten Aufruf werden Standard-Vorlagen
                automatisch angelegt — falls nichts zu sehen ist, lade die Seite neu.
              </p>
              <Button onClick={() => setWizard(true)}>
                <Wand2 className="mr-2 h-4 w-4" /> Geführt anlegen
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {prompts.map((p) => {
                const datei = p.datei_vorlage_id ? dateiMap.get(p.datei_vorlage_id) : null;
                return (
                  <li key={p.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium leading-tight">{p.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.kategorie && <Badge variant="outline" className="text-xs">{p.kategorie}</Badge>}
                          {datei ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 text-xs text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              {datei.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              ohne Datei
                            </Badge>
                          )}
                        </div>
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
                    {p.beschreibung && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.beschreibung}</p>
                    )}
                    <Button variant="ghost" size="sm" className="mt-3 self-start" onClick={() => setEdit(p)}>
                      Anzeigen / Bearbeiten
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        {/* ── Datei-Vorlagen ───────────────────────────────────────────────── */}
        <TabsContent value="dateien" className="pt-4">
          <DateiVorlagenBibliothek />
        </TabsContent>
      </Tabs>

      <KundenPromptWizardDialog open={wizard} onOpenChange={setWizard} />
      <KundenPromptFormDialog open={neu} onOpenChange={setNeu} />
      <KundenPromptFormDialog
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        vorlage={edit}
      />

      <ConfirmDialog
        open={!!loeschenId}
        onOpenChange={(o) => !o && setLoeschenId(null)}
        title="Vorlage löschen?"
        description="Die Prompt-Vorlage wird unwiderruflich entfernt. Verknüpfte Datei-Vorlagen bleiben in der Bibliothek erhalten."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
