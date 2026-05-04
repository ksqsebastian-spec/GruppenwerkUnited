'use client';

import { useState } from 'react';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { exportPayloadToMarkdown } from '@/lib/export/export-to-markdown';
import type { ExportPayload } from '@/lib/export/full-export';

type ExportFormat = 'json' | 'markdown';

interface DataExportButtonProps {
  companyName: string;
}

/**
 * Löst einen Browser-Download einer Datei aus.
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildFilename(companyName: string, format: ExportFormat): string {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  const ext = format === 'json' ? 'json' : 'md';
  return `gruppenwerk-export-${slug}-${date}.${ext}`;
}

/**
 * Export-Button mit Formatauswahl-Dialog.
 * Ruft /api/data-export auf und löst einen Browser-Download aus.
 */
export function DataExportButton({ companyName }: DataExportButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data-export');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Export fehlgeschlagen');
      }

      const payload = (await res.json()) as ExportPayload;
      const filename = buildFilename(companyName, format);

      if (format === 'json') {
        triggerDownload(
          JSON.stringify(payload, null, 2),
          filename,
          'application/json'
        );
      } else {
        const md = exportPayloadToMarkdown(payload);
        triggerDownload(md, filename, 'text/markdown; charset=utf-8');
      }

      toast.success('Export erfolgreich heruntergeladen');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#e5e5e5] text-sm font-medium text-[#737373] hover:bg-[#f5f5f5] hover:text-[#000000] transition-colors shrink-0">
          <Download className="h-4 w-4" />
          Daten exportieren
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daten exportieren</DialogTitle>
          <DialogDescription>
            Exportiert alle Daten deines Accounts als Datei zur Revisionssicherheit.
            Dokument-Dateien werden nicht exportiert – nur deren Metadaten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm font-medium text-foreground">Format wählen</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('json')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors ${
                format === 'json'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <FileJson className="h-6 w-6" />
              <span className="font-medium">JSON</span>
              <span className="text-xs text-center leading-tight">
                Maschinenlesbar, vollständig strukturiert
              </span>
            </button>

            <button
              onClick={() => setFormat('markdown')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors ${
                format === 'markdown'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <FileText className="h-6 w-6" />
              <span className="font-medium">Markdown</span>
              <span className="text-xs text-center leading-tight">
                Menschenlesbar, für Revisionen geeignet
              </span>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird exportiert…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export starten
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
