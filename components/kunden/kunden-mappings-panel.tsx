'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Copy, KeyRound, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useKundenMappings, useDeleteKundenMapping } from '@/hooks/use-kunden';
import type { CustomerMapping } from '@/types';

interface KundenMappingsPanelProps {
  customerId: string;
}

export function KundenMappingsPanel({ customerId }: KundenMappingsPanelProps): React.JSX.Element {
  const [zuLoeschen, setZuLoeschen] = useState<string | null>(null);
  const [kopiertId, setKopiertId] = useState<string | null>(null);

  const { data: mappings = [], isLoading } = useKundenMappings(customerId);
  const remove = useDeleteKundenMapping(customerId);

  const handleCopy = async (mapping: CustomerMapping): Promise<void> => {
    const text = mapping.eintraege.map((e) => `${e.code} = ${e.value}  (${e.label})`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setKopiertId(mapping.id);
      toast.success('Mapping kopiert');
      window.setTimeout(() => setKopiertId(null), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
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

  if (isLoading) return <LoadingSpinner size="sm" />;

  if (mappings.length === 0) {
    return (
      <EmptyState
        icon={<KeyRound className="h-10 w-10 text-muted-foreground" />}
        title="Noch keine gespeicherten Codes"
        description={'Wenn du im Tab „Dokument erstellen" mit aktivierter Verschlüsselung einen Prompt erzeugst, kannst du die Code-Tabelle hier beim Kunden ablegen — z.B. um die KI-Antwort später zurückzuübersetzen.'}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Gespeicherte Code↔Klartext-Zuordnungen. Damit kannst du die anonymisierten KI-Antworten
        wieder in echte Kundendaten zurückübersetzen.
      </p>

      <ul className="space-y-3">
        {mappings.map((m) => (
          <li key={m.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{m.anlass}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(m.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr ·{' '}
                  {m.eintraege.length} {m.eintraege.length === 1 ? 'Eintrag' : 'Einträge'}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => handleCopy(m)}>
                  {kopiertId === m.id ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                  Kopieren
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZuLoeschen(m.id)}
                  aria-label="Mapping löschen"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <ul className="mt-3 space-y-0.5 rounded-md bg-muted/40 p-3 font-mono text-xs">
              {m.eintraege.map((e) => (
                <li key={e.code}>
                  <span className="font-medium">{e.code}</span>
                  <span className="text-muted-foreground"> = </span>
                  {e.value}
                  {e.label && <span className="text-muted-foreground"> ({e.label})</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!zuLoeschen}
        onOpenChange={(o) => !o && setZuLoeschen(null)}
        title="Mapping löschen?"
        description="Die gespeicherte Code-Zuordnung wird unwiderruflich entfernt. Die zugrunde liegenden Datenkodierungen bleiben erhalten."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
