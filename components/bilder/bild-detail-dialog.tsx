'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Copy, Download, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FirmaBadge } from '@/components/tickets/firma-badge';
import { useDeleteBild } from '@/hooks/use-bilder';
import type { BildMitUrl } from '@/hooks/use-bilder';

interface BildDetailDialogProps {
  bild: BildMitUrl | null;
  onClose: () => void;
}

function formatGroesse(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BildDetailDialog({ bild, onClose }: BildDetailDialogProps): React.JSX.Element | null {
  const [copied, setCopied] = useState(false);
  const [confirmLoeschen, setConfirmLoeschen] = useState(false);
  const remove = useDeleteBild();

  if (!bild) return null;

  const handleCopyUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(bild.public_url);
      setCopied(true);
      toast.success('Link kopiert');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await remove.mutateAsync(bild.id);
      setConfirmLoeschen(false);
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
            <DialogTitle>{bild.titel ?? bild.dateiname}</DialogTitle>
            {bild.beschreibung && (
              <DialogDescription>{bild.beschreibung}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Vollbild */}
            <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bild.public_url}
                alt={bild.titel ?? bild.dateiname}
                className="max-h-[60vh] w-full object-contain"
              />
            </div>

            {/* Meta */}
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Firmen</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {bild.firmen_tags.length > 0 ? (
                    bild.firmen_tags.map((f) => <FirmaBadge key={f} firma={f} />)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Hochgeladen von</p>
                <p>{bild.uploaded_by}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Datum</p>
                <p>{format(new Date(bild.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Datei</p>
                <p>
                  {bild.dateiname} · {formatGroesse(bild.dateigroesse)}
                </p>
              </div>
            </div>

            {/* Aktionen */}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button onClick={handleCopyUrl} size="sm">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Link kopiert' : 'Link kopieren'}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={bild.public_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> In neuem Tab öffnen
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={bild.public_url} download={bild.dateiname}>
                  <Download className="mr-2 h-4 w-4" /> Herunterladen
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => setConfirmLoeschen(true)}
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
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmLoeschen}
        onOpenChange={setConfirmLoeschen}
        title="Bild löschen?"
        description="Das Bild wird unwiderruflich entfernt. Wenn die URL noch in Webseiten oder Social-Media-Posts eingebettet ist, bricht der Link dort."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
