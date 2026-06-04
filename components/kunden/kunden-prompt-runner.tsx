'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { useKundenPrompts, useRenderKundenPrompt } from '@/hooks/use-kunden';

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
      toast.success('In die Zwischenablage kopiert');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const ausgewaehlt = prompts.find((p) => p.id === promptId);

  if (isLoading) return <LoadingSpinner size="sm" />;

  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-10 w-10 text-muted-foreground" />}
        title="Noch keine Prompt-Vorlagen"
        description="Lege Vorlagen für Rechnungen, Mahnungen oder Angebote an. Platzhalter wie {{customer.firmenname}} und {{MWST}} werden automatisch befüllt."
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
        </div>
      )}
    </div>
  );
}
