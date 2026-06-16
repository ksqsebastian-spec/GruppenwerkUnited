'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BadgePercent,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Download,
  File as FileIcon,
  FilePlus,
  FileText,
  Loader2,
  Lock,
  Mail,
  Receipt,
  Save,
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
  useCreateKundenMapping,
  useDateiVorlagen,
  getDateiVorlageDownloadUrl,
} from '@/hooks/use-kunden';
import { DateiVorlageSelect } from './datei-vorlage-select';
import { KATEGORIE_ICON } from '@/lib/kunden/starter-prompts';
import type { CustomerPrompt, CustomerPromptRendered, DateiVorlage } from '@/types';

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
  /** Aktuell gewählte Datei (initial: am Prompt verknüpft, durch Nutzer überschreibbar). */
  datei: DateiVorlage | null;
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
  const { data: dateiVorlagen = [] } = useDateiVorlagen();
  const render = useRenderKundenPrompt(customerId);
  const saveMapping = useCreateKundenMapping(customerId);
  const [mappingGespeichert, setMappingGespeichert] = useState(false);

  const ladeDateiUrl = async (id: string): Promise<string | null> => {
    try {
      return await getDateiVorlageDownloadUrl(id);
    } catch {
      return null;
    }
  };

  const handleCardClick = async (prompt: CustomerPrompt): Promise<void> => {
    try {
      const result = await render.mutateAsync({ promptId: prompt.id, encode });
      const datei = prompt.datei_vorlage_id
        ? dateiVorlagen.find((d) => d.id === prompt.datei_vorlage_id) ?? null
        : null;
      const vorlageUrl = datei ? await ladeDateiUrl(datei.id) : null;
      setErgebnis({
        prompt,
        text: result.prompt,
        missing: result.missing_placeholders,
        encoded: !!result.encoded,
        mapping: result.mapping ?? [],
        datei,
        vorlageUrl,
      });
      setCopied(false);
      setMappingGespeichert(false);
    } catch {
      // Toast vom Hook
    }
  };

  /** Ersetzt die aktuell ausgewählte Datei-Vorlage am laufenden Ergebnis. */
  const handleSwapDatei = async (id: string | null): Promise<void> => {
    if (!ergebnis) return;
    const datei = id ? dateiVorlagen.find((d) => d.id === id) ?? null : null;
    const vorlageUrl = datei ? await ladeDateiUrl(datei.id) : null;
    setErgebnis({ ...ergebnis, datei, vorlageUrl });
  };

  const handleSaveMapping = async (): Promise<void> => {
    if (!ergebnis || ergebnis.mapping.length === 0) return;
    const anlass = ergebnis.prompt.kategorie
      ? `${ergebnis.prompt.kategorie} — ${ergebnis.prompt.name}`
      : ergebnis.prompt.name;
    try {
      await saveMapping.mutateAsync({ anlass, eintraege: ergebnis.mapping });
      setMappingGespeichert(true);
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

  /**
   * Kopiert die Vorlage-Datei als echtes Bild in die Zwischenablage, sodass sie
   * direkt im KI-Chat eingefügt werden kann (Strg/Cmd+V). Funktioniert für
   * Bilder (PNG/JPG); andere Formate (PDF/DOCX) unterstützt die Clipboard-API
   * nicht — dann automatisch Download.
   */
  const handleCopyDatei = async (): Promise<void> => {
    if (!ergebnis?.datei) return;
    const typ = ergebnis.datei.dateityp ?? '';
    try {
      const url = ergebnis.vorlageUrl ?? (await getDateiVorlageDownloadUrl(ergebnis.datei.id));
      const resp = await fetch(url);
      const blob = await resp.blob();

      // Clipboard-API unterstützt zuverlässig nur Bilder (v.a. PNG).
      const clipboardFaehig =
        typeof ClipboardItem !== 'undefined' && typ.startsWith('image/');
      if (clipboardFaehig) {
        // PNG ist am breitesten unterstützt; andere Bildtypen versuchen wir direkt.
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        toast.success('Datei kopiert — im KI-Chat mit Strg/Cmd+V einfügen');
        return;
      }
      // Nicht-Bild: direkter Download als Fallback
      triggerDownload(url, ergebnis.datei.dateiname);
      toast.info('Dieses Format kann nicht kopiert werden — Datei wurde heruntergeladen');
    } catch {
      toast.error('Kopieren fehlgeschlagen — bitte herunterladen');
    }
  };

  const triggerDownload = (url: string, filename: string): void => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async (): Promise<void> => {
    if (!ergebnis?.datei) return;
    try {
      const url = ergebnis.vorlageUrl ?? (await getDateiVorlageDownloadUrl(ergebnis.datei.id));
      triggerDownload(url, ergebnis.datei.dateiname);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download fehlgeschlagen');
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    if (!ergebnis?.vorlageUrl || !ergebnis?.datei) return;
    const mime = ergebnis.datei.dateityp || 'application/octet-stream';
    const url = new URL(ergebnis.vorlageUrl, window.location.href).toString();
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('DownloadURL', `${mime}:${ergebnis.datei.dateiname}:${url}`);
    e.dataTransfer.setData('text/uri-list', url);
    e.dataTransfer.setData('text/plain', url);
  };

  if (isLoading) return <LoadingSpinner size="sm" text="Vorlagen werden geladen…" />;

  // ── Ergebnis-Ansicht ────────────────────────────────────────────────────────
  if (ergebnis) {
    const { prompt, text, missing, encoded, mapping, datei, vorlageUrl } = ergebnis;
    const istBild = (datei?.dateityp ?? '').startsWith('image/');
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1 font-medium">
                    <Lock className="h-3.5 w-3.5" /> Code → Klartext (nur für dich)
                  </p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={handleCopyMapping}>
                      {copiedMapping ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                      Kopieren
                    </Button>
                    <Button
                      size="sm"
                      variant={mappingGespeichert ? 'outline' : 'default'}
                      onClick={handleSaveMapping}
                      disabled={saveMapping.isPending || mappingGespeichert}
                    >
                      {saveMapping.isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : mappingGespeichert ? (
                        <Check className="mr-1 h-3 w-3" />
                      ) : (
                        <Save className="mr-1 h-3 w-3" />
                      )}
                      {mappingGespeichert ? 'Gespeichert' : 'Beim Kunden speichern'}
                    </Button>
                  </div>
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

            {datei ? (
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
                    <p className="truncate text-sm font-medium">{datei.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{datei.dateiname}</p>
                  </div>
                </div>
                {istBild ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      <strong>Datei kopieren</strong> und im KI-Chat mit Strg/Cmd+V einfügen — ohne Download.
                      Oder die Datei direkt in den Chat ziehen.
                    </p>
                    <Button size="sm" onClick={handleCopyDatei}>
                      <ClipboardCopy className="mr-2 h-4 w-4" /> Datei kopieren (zum Einfügen)
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" /> Herunterladen
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      <strong>In den KI-Chat ziehen.</strong> In der Claude-/ChatGPT-Desktop-App funktioniert das
                      direkt; im Browser-Tab bitte herunterladen und anhängen.
                    </p>
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" /> Herunterladen
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                Keine Datei-Vorlage ausgewählt.
                <br />
                Wähle unten eine aus der Bibliothek oder lege eine in{' '}
                <Link href="/kunden/prompts?tab=dateien" className="underline">
                  Vorlagen verwalten
                </Link>{' '}
                an.
              </div>
            )}

            {/* Datei aus Bibliothek wechseln */}
            <details className="mt-2 rounded-md border border-border bg-card p-2 text-xs">
              <summary className="cursor-pointer select-none">Andere Datei wählen</summary>
              <div className="mt-2">
                <DateiVorlageSelect
                  value={datei?.id ?? null}
                  onChange={(id) => void handleSwapDatei(id)}
                  label=""
                />
              </div>
            </details>
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
                  {p.datei_vorlage_id && (
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
