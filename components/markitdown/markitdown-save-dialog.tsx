'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAllTags, useSaveTemplate, useSavedByName } from '@/hooks/use-markitdown';
import { TagInput } from './tag-input';

interface MarkitdownSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Aktuelles Markdown im Editor, wird beim Speichern übernommen. */
  markdown: string;
  /** Original-Dateiname/-typ vom Konvertierungsschritt (informativ). */
  sourceName?: string | null;
  sourceType?: string | null;
  /** Vorausfüllung des Titels (z.B. Dateiname ohne Endung). */
  defaultTitel?: string;
  onSaved?: () => void;
}

export function MarkitdownSaveDialog({
  open,
  onOpenChange,
  markdown,
  sourceName,
  sourceType,
  defaultTitel,
  onSaved,
}: MarkitdownSaveDialogProps): React.JSX.Element {
  const save = useSaveTemplate();
  const { data: tagInfos = [] } = useAllTags();
  const [merkeName, setzeMerkeName] = useSavedByName();

  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [savedBy, setSavedBy] = useState('');

  useEffect(() => {
    if (open) {
      setTitel(defaultTitel ?? '');
      setBeschreibung('');
      setTags([]);
      setSavedBy(merkeName);
    }
  }, [open, defaultTitel, merkeName]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await save.mutateAsync({
        titel: titel.trim(),
        beschreibung: beschreibung.trim() || null,
        tags,
        markdown,
        source_dateiname: sourceName ?? null,
        source_dateityp: sourceType ?? null,
        saved_by: savedBy.trim(),
      });
      setzeMerkeName(savedBy.trim());
      onSaved?.();
      onOpenChange(false);
    } catch {
      // Toast vom Hook
    }
  };

  const valid = titel.trim().length > 0 && savedBy.trim().length > 0 && markdown.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Als Vorlage speichern</DialogTitle>
            <DialogDescription>
              Das konvertierte Markdown landet in der Bibliothek — sichtbar für alle Firmen.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mit-titel">
                Titel <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mit-titel"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                maxLength={200}
                placeholder="z.B. Rechnungs-Vorlage Bau"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mit-beschreibung">Beschreibung (optional)</Label>
              <Textarea
                id="mit-beschreibung"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                rows={2}
                maxLength={1000}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mit-tags">Tags</Label>
              <TagInput
                id="mit-tags"
                value={tags}
                onChange={setTags}
                suggestions={tagInfos.map((t) => t.tag)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mit-by">
                Gespeichert von <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mit-by"
                value={savedBy}
                onChange={(e) => setSavedBy(e.target.value)}
                maxLength={120}
                placeholder="Dein Name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Wird im Browser gemerkt — beim nächsten Speichern steht dein Name schon drin.
              </p>
            </div>

            {sourceName && (
              <p className="text-xs text-muted-foreground">
                Quelle: <span className="font-mono">{sourceName}</span>
              </p>
            )}
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-background pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={save.isPending || !valid}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
