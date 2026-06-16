'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useKundenKommentare,
  useCreateKundenKommentar,
  useDeleteKundenKommentar,
} from '@/hooks/use-kunden';

interface KundenKommentarePanelProps {
  customerId: string;
}

export function KundenKommentarePanel({ customerId }: KundenKommentarePanelProps): React.JSX.Element {
  const [text, setText] = useState('');
  const [zuLoeschen, setZuLoeschen] = useState<string | null>(null);

  const { data: kommentare = [], isLoading } = useKundenKommentare(customerId);
  const create = useCreateKundenKommentar(customerId);
  const remove = useDeleteKundenKommentar(customerId);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const value = text.trim();
    if (value.length === 0) return;
    try {
      await create.mutateAsync(value);
      setText('');
    } catch {
      // Toast vom Hook
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
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Kommentar schreiben…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={5000}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending || text.trim().length === 0}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kommentar hinzufügen
          </Button>
        </div>
      </form>

      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : kommentare.length === 0 ? (
        <EmptyState title="Noch keine Kommentare" description="Schreibe den ersten Eintrag zur Historie." />
      ) : (
        <ul className="space-y-2">
          {kommentare
            .slice()
            .reverse()
            .map((k) => (
              <li
                key={k.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-card p-3"
              >
                <div className="flex-1">
                  <p className="whitespace-pre-wrap text-sm">{k.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(k.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZuLoeschen(k.id)}
                  aria-label="Kommentar löschen"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!zuLoeschen}
        onOpenChange={(o) => !o && setZuLoeschen(null)}
        title="Kommentar löschen?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
