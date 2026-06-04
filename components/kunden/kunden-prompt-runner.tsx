'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Download, File as FileIcon, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  useKundenPrompts,
  useRenderKundenPrompt,
  getKundenPromptVorlageDownloadUrl,
} from '@/hooks/use-kunden';
import type { CustomerPrompt, CustomerPromptRendered } from '@/types';

interface KundenPromptRunnerProps {
  customerId: string;
}

interface Ergebnis {
  prompt: CustomerPrompt;
  text: string;
  missing: string[];
  encoded: boolean;
  mapping: NonNullable<CustomerPromptRendered['mapping']>;
  /** Signierte URL der Vorlage-Datei (für Drag & Download). */
  vorlageUrl: string | null;
}

export function KundenPromptRunner({ customerId }: KundenPromptRunnerProps): React.JSX.Element {
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [encode, setEncode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedMapping, setCopiedMapping] = useState(false);

  const { data: prompts = [], isLoading } = useKundenPrompts();
  const render = useRenderKundenPrompt(customerId);

  const handleCardClick = async (prompt: CustomerPrompt): Promise<void> => {
    try {
      const result = await render.mutateAsync({ promptId: prompt.id, encode });
      // Signed URL parallel laden, falls eine Vorlage-Datei hängt
      let vorlageUrl: string | null = null;
      if (prompt.vorlage_dateipfad) {
        try {
          vorlageUrl = await getKundenPromptVorlageDownloadUrl(prompt.id);
        } catch {
          // URL-Fehler ist nicht-blockierend — Download-Button fängt das auf
        }
      }
      setErgebnis({
        prompt,
        text: result.prompt,
        missing: result.missing_placeholders,
        encoded: !!result.encoded,
        mapping: result.mapping ?? [],
        vorlageUrl,
      });
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

  const handleCopyMapping = async (): Promise<void> => {
    if (!ergebnis || ergebnis.mapping.length === 0) return;
    const text = ergebnis.mapping.map((m) => `${m.code} = ${m.value}  (${m.label})`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMapping(true);
      toast.success('Code-Mapping kopiert');
      window.setTimeout(() => setCopiedMapping(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (!ergebnis?.prompt.vorlage_dateiname) return;
    try {
      const url = ergebnis.vorlageUrl ?? (await getKundenPromptVorlageDownloadUrl(ergebnis.prompt.id));
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

  /**
   * Chrome / Edge: macht die Datei direkt aus dem Browser zu einer Anwendung
   * draggable. Wir setzen das `DownloadURL`-DataTransfer-Format, damit der
   * Browser beim Drop die Datei holt und an die Zielanwendung übergibt — so
   * lässt sich die Vorlage z.B. direkt in Claude.ai ziehen.
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    if (!ergebnis?.vorlageUrl || !ergebnis.prompt.vorlage_dateiname) return;
    const mime = ergebnis.prompt.vorlage_dateityp || 'application/octet-stream';
    const url = new URL(ergebnis.vorlageUrl, window.location.href).toString();
    e.dataTransfer.effectAllowed = 'copy';
    // DownloadURL-Format: "<mime>:<filename>:<absolute url>"
    e.dataTransfer.setData('DownloadURL', `${mime}:${ergebnis.prompt.vorlage_dateiname}:${url}`);
    e.dataTransfer.setData('text/uri-list', url);
    e.dataTransfer.setData('text/plain', url);
  };

  if (isLoading) return <LoadingSpinner size="sm" text="Vorlagen werden geladen…" />;

  // ── Ergebnis-Ansicht ────────────────────────────────────────────────────────
  if (ergebnis) {
    const { prompt, text, missing, encoded, mapping, vorlageUrl } = ergebnis;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setErgebnis(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Auswahl
          </Button>
          <div className="flex items-center gap-2">
            {encoded && (
              <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Kundendaten verschlüsselt
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {prompt.kategorie ? `${prompt.kategorie} — ${prompt.name}` : prompt.name}
            </span>
          </div>
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

            {encoded && mapping.length > 0 && (
              <div className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1 font-medium">
                    <Lock className="h-3.5 w-3.5" /> Code → Klartext (nur für dich)
                  </p>
                  <Button size="sm" variant="outline" onClick={handleCopyMapping}>
                    {copiedMapping ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                    Mapping kopieren
                  </Button>
                </div>
                <p className="mt-1 mb-2">
                  In der KI-Antwort die Codes durch die echten Werte ersetzen.
                </p>
                <ul className="space-y-0.5 font-mono">
                  {mapping.map((m) => (
                    <li key={m.code}>
                      <span className="font-medium">{m.code}</span>
                      <span className="text-emerald-700/70 dark:text-emerald-300/70"> = </span>
                      {m.value}
                      <span className="text-emerald-700/70 dark:text-emerald-300/70"> ({m.label})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Vorlage-Datei */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Schritt 2 — Vorlage in den Chat ziehen</span>
            {prompt.vorlage_dateiname ? (
              <div
                draggable={!!vorlageUrl}
                onDragStart={handleDragStart}
                className={`flex flex-col gap-3 rounded-md border-2 border-dashed border-primary/40 bg-card p-4 transition-colors hover:border-primary ${
                  vorlageUrl ? 'cursor-grab active:cursor-grabbing' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="h-8 w-8 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{prompt.vorlage_dateiname}</p>
                    {prompt.vorlage_dateigroesse != null && (
                      <p className="text-xs text-muted-foreground">
                        {(prompt.vorlage_dateigroesse / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Direkt in den KI-Chat ziehen.</strong> Falls dein Browser das nicht unterstützt,
                  herunterladen und manuell anhängen.
                </p>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Stattdessen herunterladen
                </Button>
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Wähle einen Anwendungsfall — die Kundendaten werden automatisch eingefügt.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/kunden/prompts">Vorlagen verwalten</Link>
        </Button>
      </div>

      <label
        htmlFor="encode-toggle"
        className="flex cursor-pointer items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50/40 p-3 dark:border-emerald-800 dark:bg-emerald-950/20"
      >
        <Checkbox
          id="encode-toggle"
          checked={encode}
          onCheckedChange={(v) => setEncode(v === true)}
          className="mt-0.5"
        />
        <div className="flex-1 text-sm">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            Kundendaten vor der KI verschlüsseln (empfohlen)
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Firmenname, Ansprechpartner &amp; Co. werden durch eindeutige Codes ersetzt — die KI
            sieht nie die echten Daten. Codes &amp; Mapping landen automatisch in deiner
            „Datenkodierung".
          </p>
        </div>
      </label>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {prompts.map((p) => {
          const isPending = render.isPending && render.variables?.promptId === p.id;
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
