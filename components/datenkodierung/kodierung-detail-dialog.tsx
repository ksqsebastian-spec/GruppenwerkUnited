'use client';

import { useState, useRef } from 'react';
import { Copy, Check, AlertTriangle, Tag, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { useUpdateDatenkodierungTags } from '@/hooks/use-datenkodierung';
import type { Datenkodierung } from '@/types';

interface KodierungDetailDialogProps {
  datensatz: Datenkodierung | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagFilter?: (tag: string) => void;
}

function tagColor(tag: string): string {
  const colors = ['#c96442', '#2563eb', '#16a34a', '#7C3AED', '#d97706', '#0891b2'];
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

export function KodierungDetailDialog({
  datensatz,
  open,
  onOpenChange,
  onTagFilter,
}: KodierungDetailDialogProps): React.JSX.Element {
  const [codeCopied, setCodeCopied] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const { mutate: saveTags, isPending: savingTags } = useUpdateDatenkodierungTags();

  const handleCopyCode = async (): Promise<void> => {
    if (!datensatz) return;
    await navigator.clipboard.writeText(datensatz.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleOpenChange = (isOpen: boolean): void => {
    if (isOpen && datensatz) {
      setLocalTags(datensatz.tags ?? []);
    }
    if (!isOpen) {
      setTagInput('');
    }
    onOpenChange(isOpen);
  };

  function addTag(): void {
    const trimmed = tagInput.trim();
    if (!trimmed || localTags.includes(trimmed) || localTags.length >= 10) return;
    const updated = [...localTags, trimmed];
    setLocalTags(updated);
    setTagInput('');
    tagInputRef.current?.focus();
    if (datensatz) {
      saveTags({ id: datensatz.id, tags: updated });
    }
  }

  function removeTag(tag: string): void {
    const updated = localTags.filter((t) => t !== tag);
    setLocalTags(updated);
    if (datensatz) {
      saveTags({ id: datensatz.id, tags: updated });
    }
  }

  if (!datensatz) return <></>;

  const displayTags = open ? localTags : (datensatz.tags ?? []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kodierter Datensatz</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Code prominent anzeigen */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Code
            </p>
            <p className="font-mono text-2xl font-bold tracking-widest text-primary">
              {datensatz.code}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={handleCopyCode}
            >
              {codeCopied ? (
                <>
                  <Check className="mr-1 h-3 w-3 text-green-500" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Code kopieren
                </>
              )}
            </Button>
          </div>

          {/* Echte Daten */}
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Name
              </p>
              <p className="mt-1 font-medium">{datensatz.name}</p>
            </div>

            {datensatz.adresse && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Adresse
                </p>
                <p className="mt-1">{datensatz.adresse}</p>
              </div>
            )}

            {datensatz.notizen && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Notizen
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{datensatz.notizen}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Erstellt am
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(new Date(datensatz.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Tags
            </p>

            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: tagColor(tag) }}
                  >
                    <button
                      onClick={() => {
                        onTagFilter?.(tag);
                        onOpenChange(false);
                      }}
                      className="hover:opacity-80"
                      title={`Nach "${tag}" filtern`}
                    >
                      {tag}
                    </button>
                    <button
                      onClick={() => removeTag(tag)}
                      disabled={savingTags}
                      className="ml-0.5 rounded-full hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                  }}
                  placeholder="Neuer Tag..."
                  maxLength={30}
                  disabled={savingTags || displayTags.length >= 10}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={savingTags || !tagInput.trim() || displayTags.length >= 10}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Datenschutzhinweis */}
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              Diese Daten dürfen nicht an KI-Systeme weitergegeben werden. Nur den Code verwenden.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
