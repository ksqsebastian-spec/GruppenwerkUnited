'use client';

import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import type { Datenkodierung } from '@/types';

interface KodierungDetailDialogProps {
  datensatz: Datenkodierung | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KodierungDetailDialog({
  datensatz,
  open,
  onOpenChange,
}: KodierungDetailDialogProps): React.JSX.Element {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async (): Promise<void> => {
    if (!datensatz) return;
    await navigator.clipboard.writeText(datensatz.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!datensatz) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
