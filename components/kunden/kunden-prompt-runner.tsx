'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BadgePercent,
  Check,
  CheckCircle2,
  Copy,
  Download,
  File as FileIcon,
  FilePlus,
  FileText,
  Loader2,
  Lock,
  Mail,
  Receipt,
  Settings2,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
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
import { KATEGORIE_ICON } from '@/lib/kunden/starter-prompts';
import type { CustomerPrompt, CustomerPromptRendered } from '@/types';

interface KundenPromptRunnerProps {
  customerId: string;
  /** Wird im Wizard-Titel verwendet („Was möchtest du für X erzeugen?"). */
  kundenname: string;
}

interface Ergebnis {
  prompt: CustomerPrompt;
  text: string;
  missing: string[];
  encoded: boolean;
  mapping: NonNullable<CustomerPromptRendered['mapping']>;
  vorlageUrl: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Receipt,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Truck,
  BadgePercent,
  Mail,
  FilePlus,
};

function iconForPrompt(p: CustomerPrompt): React.ElementType {
  const key = (p.kategorie && KATEGORIE_ICON[p.kategorie]) ?? 'FilePlus';
  return ICON_MAP[key] ?? FilePlus;
}

export function KundenPromptRunner({ customerId, kundenname }: KundenPromptRunnerProps): React.JSX.Element {
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [encode, setEncode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedMapping, setCopiedMapping] = useState(false);

  const { data: prompts = [], isLoading } = useKundenPrompts();
  const render = useRenderKundenPrompt(customerId);

  const handleCardClick = async (prompt: CustomerPrompt): Promise<void> => {
    try {
      const result = await render.mutateAsync({ promptId: prompt.id, encode });
      let vorlageUrl: string | null = null;
      if (prompt.vorlage_dateipfad) {
        try {
          vorlageUrl = await getKundenPromptVorlageDownloadUrl(prompt.id);
        } catch {
          // URL-Fehler ist nicht-blockierend
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    if (!ergebnis?.vorlageUrl || !ergebnis.prompt.vorlage_dateiname) return;
    const mime = ergebnis.prompt.vorlage_dateityp || 'application/octet-stream';
    const url = new URL(ergebnis.vorlageUrl, window.location.href).toString();
    e.dataTransfer.effectAllowed = 'copy';
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
            Anderen Anlass wählen
          </Button>
          <div className="flex items-center gap-2">
            {encoded && (
              <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Kundendaten verschlüsselt
              </Badge>
            )}
            <span className="text-sm font-medium">
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
                <p className="mt-1 mb-2">In der KI-Antwort die Codes durch die echten Werte ersetzen.</p>
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
                  <strong>Direkt in den KI-Chat ziehen.</strong> Funktioniert in Chrome/Edge; sonst herunterladen.
                </p>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Stattdessen herunterladen
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                Keine Datei-Vorlage hinterlegt.
                <br />
                <Link href={`/kunden/prompts`} className="underline">
                  Hier eine Word-/PDF-Vorlage anhängen
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard-Auswahl ──────────────────────────────────────────────────────────
  if (prompts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
        <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Keine Vorlagen gefunden. Lege welche in der{' '}
          <Link href="/kunden/prompts" className="underline">Vorlagen-Bibliothek</Link>{' '}
          an.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold sm:text-2xl">
          Was möchtest du für{' '}
          <span className="text-primary">{kundenname}</span>{' '}
          erzeugen?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle einen Anlass — der Prompt-Text wird mit den Kundendaten gefüllt.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {prompts.map((p) => {
          const Icon = iconForPrompt(p);
          const isPending = render.isPending && render.variables?.promptId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => handleCardClick(p)}
                disabled={render.isPending}
                className="group flex h-full w-full flex-col items-start gap-3 rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/60 hover:bg-muted/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    {isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  {p.vorlage_dateiname && (
                    <Badge variant="outline" className="border-emerald-300 text-xs text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                      <FileIcon className="mr-1 h-3 w-3" />
                      Datei
                    </Badge>
                  )}
                </div>
                <div className="min-h-[2.5rem]">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  {p.beschreibung && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.beschreibung}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col items-center gap-1 border-t pt-4 text-xs text-muted-foreground">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={encode}
            onChange={(e) => setEncode(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            Kundendaten vor der KI verschlüsseln (empfohlen) — Namen werden durch Codes ersetzt.
          </span>
        </label>
        <Link href="/kunden/prompts" className="mt-2 inline-flex items-center gap-1 hover:underline">
          <Settings2 className="h-3 w-3" /> Vorlagen anpassen
        </Link>
      </div>
    </div>
  );
}
