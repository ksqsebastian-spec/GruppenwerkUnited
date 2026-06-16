'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Download, File as FileIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useDateiVorlagen,
  useUploadDateiVorlage,
  useDeleteDateiVorlage,
  getDateiVorlageDownloadUrl,
} from '@/hooks/use-kunden';

interface MetaFelder {
  name: string;
  kategorie: string;
  beschreibung: string;
}

function formatGroesse(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DateiVorlagenBibliothek(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<MetaFelder>({ name: '', kategorie: '', beschreibung: '' });
  const [loeschenId, setLoeschenId] = useState<string | null>(null);

  const { data: vorlagen = [], isLoading, error } = useDateiVorlagen();
  const upload = useUploadDateiVorlage();
  const remove = useDeleteDateiVorlage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setMeta({ name: file.name.replace(/\.[^.]+$/, ''), kategorie: '', beschreibung: '' });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!pendingFile) return;
    try {
      await upload.mutateAsync({
        file: pendingFile,
        name: meta.name.trim(),
        kategorie: meta.kategorie.trim() || null,
        beschreibung: meta.beschreibung.trim() || null,
      });
      setPendingFile(null);
      setMeta({ name: '', kategorie: '', beschreibung: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // Toast vom Hook
    }
  };

  const handleDownload = async (id: string, filename: string): Promise<void> => {
    try {
      const url = await getDateiVorlageDownloadUrl(id);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download fehlgeschlagen');
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!loeschenId) return;
    try {
      await remove.mutateAsync(loeschenId);
    } finally {
      setLoeschenId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload-Bereich */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Neue Datei-Vorlage hochladen</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Briefpapier (PDF), Word-/Excel-Layouts, Bilder etc. — pro Mandant zentral verwaltet.
          Max. 10 MB.
        </p>

        {!pendingFile ? (
          <div className="mt-3">
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Datei wählen
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.md"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pendingFile.name}</span>
              <span className="text-xs text-muted-foreground">({formatGroesse(pendingFile.size)})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={meta.name}
                  onChange={(e) => setMeta((p) => ({ ...p, name: e.target.value }))}
                  required
                  maxLength={120}
                  placeholder="z.B. Briefpapier Seehafer"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Kategorie</label>
                <Input
                  value={meta.kategorie}
                  onChange={(e) => setMeta((p) => ({ ...p, kategorie: e.target.value }))}
                  maxLength={80}
                  placeholder="z.B. Briefpapier, Logo, Word-Layout"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Beschreibung</label>
              <Input
                value={meta.beschreibung}
                onChange={(e) => setMeta((p) => ({ ...p, beschreibung: e.target.value }))}
                maxLength={500}
                placeholder="Wofür ist diese Datei gedacht?"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={upload.isPending || meta.name.trim().length === 0}>
                {upload.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hochladen
              </Button>
              <Button type="button" variant="outline" onClick={() => setPendingFile(null)} disabled={upload.isPending}>
                Abbrechen
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Bibliothek */}
      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Bibliothek
        </h3>
        {isLoading ? (
          <LoadingSpinner text="Datei-Vorlagen werden geladen…" />
        ) : error ? (
          <ErrorState message="Datei-Vorlagen konnten nicht geladen werden" />
        ) : vorlagen.length === 0 ? (
          <EmptyState
            icon={<FileIcon className="h-10 w-10 text-muted-foreground" />}
            title="Noch keine Datei-Vorlagen"
            description="Lade z.B. dein Briefpapier als PDF hoch, damit es bei jeder Prompt-Vorlage zur Auswahl steht."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {vorlagen.map((v) => (
              <li key={v.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{v.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {v.kategorie && (
                        <Badge variant="outline" className="text-xs">{v.kategorie}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {v.dateiname}
                      </Badge>
                    </div>
                    {v.beschreibung && (
                      <p className="mt-2 text-xs text-muted-foreground">{v.beschreibung}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatGroesse(v.dateigroesse)} ·{' '}
                      {format(new Date(v.created_at), 'dd. MMM yyyy', { locale: de })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(v.id, v.dateiname)}
                      aria-label="Datei herunterladen"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLoeschenId(v.id)}
                      aria-label="Datei-Vorlage löschen"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!loeschenId}
        onOpenChange={(o) => !o && setLoeschenId(null)}
        title="Datei-Vorlage löschen?"
        description="Die Datei wird unwiderruflich entfernt. Bei verknüpften Prompts wird die Datei-Auswahl automatisch entfernt — die Prompts selbst bleiben erhalten."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
