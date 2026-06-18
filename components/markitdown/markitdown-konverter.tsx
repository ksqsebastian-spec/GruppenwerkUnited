'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConvertFile } from '@/hooks/use-markitdown';
import { SUPPORTED_EXTENSIONS } from '@/lib/markitdown/convert';
import { MarkitdownSaveDialog } from './markitdown-save-dialog';

const ACCEPT = SUPPORTED_EXTENSIONS.join(',');

export function MarkitdownKonverter(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [datei, setDatei] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [saveOffen, setSaveOffen] = useState(false);
  const [istDragOver, setIstDragOver] = useState(false);

  const convert = useConvertFile();

  const verarbeiteDatei = async (file: File): Promise<void> => {
    setDatei(file);
    setMarkdown('');
    setWarnings([]);
    setCopied(false);
    try {
      const result = await convert.mutateAsync(file);
      setMarkdown(result.markdown);
      setWarnings(result.warnings ?? []);
    } catch {
      // Toast vom Hook
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    await verarbeiteDatei(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    setIstDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await verarbeiteDatei(file);
  };

  const handleKopieren = async (): Promise<void> => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success('Markdown kopiert');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const reset = (): void => {
    setDatei(null);
    setMarkdown('');
    setWarnings([]);
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const defaultTitel = datei?.name.replace(/\.[^.]+$/, '') ?? '';

  return (
    <div className="space-y-4">
      {/* Upload-Bereich */}
      {!datei ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIstDragOver(true);
          }}
          onDragLeave={() => setIstDragOver(false)}
          onDrop={handleDrop}
          className={`flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-muted/20 text-sm text-muted-foreground transition-colors ${
            istDragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="h-8 w-8" />
          <div className="text-center">
            <p className="font-medium">Datei hier ablegen oder auswählen</p>
            <p className="text-xs">PDF, DOCX, XLSX, CSV, HTML, JSON, XML, TXT · max. 20 MB</p>
          </div>
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Datei wählen
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
          <div className="flex-1 truncate text-sm">
            <p className="font-medium">{datei.name}</p>
            <p className="text-xs text-muted-foreground">
              {(datei.size / 1024).toFixed(0)} KB · {datei.type || 'unbekannter Typ'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} disabled={convert.isPending}>
            <X className="mr-1 h-4 w-4" /> Andere Datei
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Lade-Anzeige */}
      {convert.isPending && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Datei wird konvertiert…
        </div>
      )}

      {/* Warnungen */}
      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="mb-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" /> Hinweise zur Konvertierung
          </p>
          <ul className="ml-4 list-disc space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor + Aktionen */}
      {markdown && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Markdown</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleKopieren}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </Button>
              <Button size="sm" onClick={() => setSaveOffen(true)}>
                <Save className="mr-2 h-4 w-4" /> Als Vorlage speichern
              </Button>
            </div>
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Du kannst den Text vor dem Speichern oder Kopieren noch anpassen.
          </p>
        </div>
      )}

      <MarkitdownSaveDialog
        open={saveOffen}
        onOpenChange={setSaveOffen}
        markdown={markdown}
        sourceName={datei?.name ?? null}
        sourceType={datei?.type ?? null}
        defaultTitel={defaultTitel}
      />
    </div>
  );
}
