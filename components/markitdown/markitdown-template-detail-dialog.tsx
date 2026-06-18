'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useDeleteTemplate } from '@/hooks/use-markitdown';
import type { MarkitdownTemplate } from '@/types';

interface MarkitdownTemplateDetailDialogProps {
  template: MarkitdownTemplate | null;
  onClose: () => void;
}

export function MarkitdownTemplateDetailDialog({
  template,
  onClose,
}: MarkitdownTemplateDetailDialogProps): React.JSX.Element | null {
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const remove = useDeleteTemplate();

  if (!template) return null;

  const handleKopieren = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(template.markdown);
      setCopied(true);
      toast.success('Markdown kopiert');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await remove.mutateAsync(template.id);
      setConfirm(false);
      onClose();
    } catch {
      // Toast vom Hook
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template.titel}</DialogTitle>
            {template.beschreibung && (
              <DialogDescription>{template.beschreibung}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                von <span className="font-medium text-foreground">{template.saved_by}</span>
              </span>
              <span>·</span>
              <span>
                {format(new Date(template.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
              </span>
              {template.source_dateiname && (
                <>
                  <span>·</span>
                  <span className="font-mono">{template.source_dateiname}</span>
                </>
              )}
            </div>

            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex justify-between gap-2 border-y py-2">
              <Button size="sm" onClick={handleKopieren}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Kopiert' : 'Markdown kopieren'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirm(true)}
                disabled={remove.isPending}
              >
                {remove.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Löschen
              </Button>
            </div>

            <Textarea
              value={template.markdown}
              readOnly
              rows={20}
              className="font-mono text-sm"
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Vorlage löschen?"
        description="Die Vorlage wird unwiderruflich aus der Bibliothek entfernt."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
