'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Download, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useKundenDateien,
  useUploadKundenDatei,
  useDeleteKundenDatei,
  getKundenDateiDownloadUrl,
} from '@/hooks/use-kunden';

interface KundenDateienPanelProps {
  customerId: string;
}

function formatGroesse(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KundenDateienPanel({ customerId }: KundenDateienPanelProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zuLoeschen, setZuLoeschen] = useState<string | null>(null);

  const { data: dateien = [], isLoading } = useKundenDateien(customerId);
  const upload = useUploadKundenDatei(customerId);
  const remove = useDeleteKundenDatei(customerId);

  const handleSelect = (): void => fileInputRef.current?.click();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync(file);
      } catch {
        // Toast vom Hook
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (did: string, filename: string): Promise<void> => {
    try {
      const url = await getKundenDateiDownloadUrl(customerId, did);
      // In neuem Tab öffnen — der signierte Link löst beim Browser den Download aus
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download fehlgeschlagen');
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!zuLoeschen) return;
    try {
      await remove.mutateAsync(zuLoeschen);
    } finally {
      setZuLoeschen(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          PDF, JPG, PNG, WEBP, DOC(X), XLS(X), TXT, CSV. Max. 10 MB pro Datei.
        </p>
        <Button onClick={handleSelect} disabled={upload.isPending}>
          {upload.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Datei hochladen
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFiles}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : dateien.length === 0 ? (
        <EmptyState title="Keine Dateien" description="Lade die erste Datei für diesen Kunden hoch." />
      ) : (
        <ul className="space-y-2">
          {dateien.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{d.dateiname}</p>
                <p className="text-xs text-muted-foreground">
                  {formatGroesse(d.dateigroesse)} ·{' '}
                  {format(new Date(d.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(d.id, d.dateiname)}
                  aria-label="Datei herunterladen"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZuLoeschen(d.id)}
                  aria-label="Datei löschen"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!zuLoeschen}
        onOpenChange={(o) => !o && setZuLoeschen(null)}
        title="Datei löschen?"
        description="Die Datei wird unwiderruflich entfernt."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
