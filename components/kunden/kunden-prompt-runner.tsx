'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Download, File as FileIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  useKundenPrompts,
  useRenderKundenPrompt,
  getKundenPromptVorlageDownloadUrl,
} from '@/hooks/use-kunden';
import type { CustomerPrompt } from '@/types';

interface KundenPromptRunnerProps {
  customerId: string;
}

interface Ergebnis {
  prompt: CustomerPrompt;
  text: string;
  missing: string[];
}

export function KundenPromptRunner({ customerId }: KundenPromptRunnerProps): React.JSX.Element {
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: prompts = [], isLoading } = useKundenPrompts();
  const render = useRenderKundenPrompt(customerId);

  const handleCardClick = async (prompt: CustomerPrompt): Promise<void> => {
    try {
      const result = await render.mutateAsync(prompt.id);
      setErgebnis({ prompt, text: result.prompt, missing: result.missing_placeholders });
      setCopied(false);
    } catch {
      // Toast vom Hook
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!ergebnis) return;
    try {
      await navigator.clipboard.writeText(ergebnis.text);
      setCopied(true);
      toast.success('Prompt in die Zwischenablage kopiert');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleVorlageHerunterladen = async (): Promise<void> => {
    if (!ergebnis?.prompt.vorlage_dateiname) return;
    try {
      const url = await getKundenPromptVorlageDownloadUrl(ergebnis.prompt.id);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = ergebnis.prompt.vorlage_dateiname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download fehlgeschlagen');
    }
  };

  if (isLoading) return <LoadingSpinner size="sm" text="Vorlagen werden geladen…" />;

  // ── Ergebnis-Ansicht ────────────────────────────────────────────────────────
  if (ergebnis) {
    const { prompt, text, missing } = ergebnis;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setErgebnis(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Auswahl
          </Button>
          <span className="text-sm text-muted-foreground">
            {prompt.kategorie ? `${prompt.kategorie} — ${prompt.name}` : prompt.name}
          </span>
        </div>

        {missing.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="mb-1 font-medium">Einige Daten fehlen — sie wurden im Text mit Platzhaltern markiert:</p>
            <div className="flex flex-wrap gap-1">
              {missing.map((m) => (
                <Badge key={m} variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {m.replace(/^customer\./i, '')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          {/* Prompt-Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Schritt 1 — Prompt kopieren</span>
              <Button size="sm" onClick={handleCopy}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </Button>
            </div>
            <Textarea value={text} readOnly rows={16} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">
              Den kopierten Text in das ChatGPT- oder Claude-Eingabefeld einfügen.
            </p>
          </div>

          {/* Vorlage-Datei */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Schritt 2 — Vorlage anhängen</span>
            {prompt.vorlage_dateiname ? (
              <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{prompt.vorlage_dateiname}</p>
                    {prompt.vorlage_dateigroesse != null && (
                      <p className="text-xs text-muted-foreground">
                        {(prompt.vorlage_dateigroesse / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={handleVorlageHerunterladen}>
                  <Download className="mr-2 h-4 w-4" /> Herunterladen
                </Button>
                <p className="text-xs text-muted-foreground">
                  Heruntergeladene Datei per Drag&amp;Drop in den KI-Chat ziehen.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                Noch keine Vorlage-Datei hinterlegt.
                <br />
                <Link href="/kunden/prompts" className="underline">
                  Datei in der Vorlagen-Bibliothek anhängen
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Karten-Auswahl ──────────────────────────────────────────────────────────
  if (prompts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
        <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Keine Vorlagen gefunden. Lege welche in der{' '}
          <Link href="/kunden/prompts" className="underline">
            Vorlagen-Bibliothek
          </Link>{' '}
          an.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Wähle einen Anwendungsfall — die Kundendaten werden automatisch eingefügt.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/kunden/prompts">Vorlagen verwalten</Link>
        </Button>
      </div>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {prompts.map((p) => {
          const isPending = render.isPending && render.variables === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => handleCardClick(p)}
                disabled={render.isPending}
                className="flex h-full w-full flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium leading-tight">{p.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.kategorie && (
                        <Badge variant="outline" className="text-xs">
                          {p.kategorie}
                        </Badge>
                      )}
                      {p.vorlage_dateiname && (
                        <Badge variant="outline" className="border-emerald-300 text-xs text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                          <FileIcon className="mr-1 h-3 w-3" />
                          Vorlage
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {p.beschreibung && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{p.beschreibung}</p>
                )}
                <span className="mt-auto text-xs font-medium text-primary">Auswählen →</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
