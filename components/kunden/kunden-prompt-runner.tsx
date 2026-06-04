'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Download, File as FileIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useKundenPrompts,
  useRenderKundenPrompt,
  getKundenPromptVorlageDownloadUrl,
} from '@/hooks/use-kunden';

interface KundenPromptRunnerProps {
  customerId: string;
}

export function KundenPromptRunner({ customerId }: KundenPromptRunnerProps): React.JSX.Element {
  const [promptId, setPromptId] = useState<string>('');
  const [rendered, setRendered] = useState<string>('');
  const [missing, setMissing] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { data: prompts = [], isLoading } = useKundenPrompts();
  const render = useRenderKundenPrompt(customerId);

  const ausgewaehlt = prompts.find((p) => p.id === promptId);

  const handleRender = async (): Promise<void> => {
    if (!promptId) return;
    try {
      const result = await render.mutateAsync(promptId);
      setRendered(result.prompt);
      setMissing(result.missing_placeholders);
      setCopied(false);
    } catch {
      // Toast vom Hook
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!rendered) return;
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      toast.success('Prompt in die Zwischenablage kopiert');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleVorlageHerunterladen = async (): Promise<void> => {
    if (!ausgewaehlt?.vorlage_dateiname) return;
    try {
      const url = await getKundenPromptVorlageDownloadUrl(ausgewaehlt.id);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = ausgewaehlt.vorlage_dateiname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download fehlgeschlagen');
    }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;

  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-10 w-10 text-muted-foreground" />}
        title="Noch keine Prompt-Vorlagen"
        description="Lege Vorlagen für Rechnung, Mahnung oder Angebot an. Platzhalter wie {{customer.firmenname}} und {{MWST}} werden automatisch befüllt."
        action={
          <Button asChild>
            <Link href="/kunden/prompts">Zur Vorlagen-Bibliothek</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row">
        <Select value={promptId} onValueChange={setPromptId}>
          <SelectTrigger className="md:max-w-md">
            <SelectValue placeholder="Vorlage auswählen…" />
          </SelectTrigger>
          <SelectContent>
            {prompts.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.kategorie ? `${p.kategorie} — ${p.name}` : p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleRender} disabled={!promptId || render.isPending}>
          {render.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Prompt erzeugen
        </Button>
        <Button variant="outline" asChild className="md:ml-auto">
          <Link href="/kunden/prompts">Vorlagen verwalten</Link>
        </Button>
      </div>

      {ausgewaehlt?.beschreibung && (
        <p className="text-xs text-muted-foreground">{ausgewaehlt.beschreibung}</p>
      )}

      {rendered && (
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          {/* Linke Spalte: Prompt-Text + Kopieren */}
          <div className="space-y-2">
            {missing.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                <p className="mb-1 font-medium">Nicht aufgelöste Platzhalter:</p>
                <div className="flex flex-wrap gap-1">
                  {missing.map((m) => (
                    <Badge key={m} variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                      {`{{${m}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1">
                  Tipp: Kundenfelder ergänzen oder Datenkodierungen im Modul „Datenkodierung" anlegen.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Generierter Prompt</span>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </Button>
            </div>
            <Textarea value={rendered} readOnly rows={14} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">
              In ChatGPT- oder Claude-Eingabefeld einfügen.
            </p>
          </div>

          {/* Rechte Spalte: Vorlage-Datei (falls vorhanden) */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Vorlage-Datei</span>
            {ausgewaehlt?.vorlage_dateiname ? (
              <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ausgewaehlt.vorlage_dateiname}</p>
                    {ausgewaehlt.vorlage_dateigroesse != null && (
                      <p className="text-xs text-muted-foreground">
                        {(ausgewaehlt.vorlage_dateigroesse / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={handleVorlageHerunterladen}>
                  <Download className="mr-2 h-4 w-4" /> Herunterladen
                </Button>
                <p className="text-xs text-muted-foreground">
                  Heruntergeladene Datei im KI-Chat per Drag&amp;Drop hinzufügen, dann den Prompt einfügen.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                Keine Vorlage-Datei hinterlegt. <br />
                <Link href="/kunden/prompts" className="underline">
                  In der Vorlagen-Bibliothek anhängen
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
