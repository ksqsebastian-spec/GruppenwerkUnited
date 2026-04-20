'use client';

import { useState } from 'react';
import { Copy, Check, Eye, Trash2, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { KodierungDetailDialog } from '@/components/datenkodierung/kodierung-detail-dialog';

import { useDeleteDatenkodierung } from '@/hooks/use-datenkodierung';
import type { Datenkodierung } from '@/types';

interface KodierungTableProps {
  daten: Datenkodierung[];
  onNeuErstellen: () => void;
  activeTag?: string;
  onTagFilter: (tag: string) => void;
}

interface CopyButtonProps {
  code: string;
}

function tagColor(tag: string): string {
  const colors = ['#c96442', '#2563eb', '#16a34a', '#7C3AED', '#d97706', '#0891b2'];
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

function CopyButton({ code }: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6 shrink-0"
      onClick={handleCopy}
      title="Code kopieren"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function KodierungTable({ daten, onNeuErstellen, activeTag, onTagFilter }: KodierungTableProps): React.JSX.Element {
  const [detailDatensatz, setDetailDatensatz] = useState<Datenkodierung | null>(null);
  const [loeschenId, setLoeschenId] = useState<string | null>(null);

  const { mutate: loeschen, isPending: loeschenLaeuft } = useDeleteDatenkodierung();

  const handleLoeschen = (): void => {
    if (!loeschenId) return;
    loeschen(loeschenId, {
      onSuccess: () => setLoeschenId(null),
    });
  };

  if (daten.length === 0) {
    return (
      <EmptyState
        icon={<ShieldOff className="h-12 w-12 text-muted-foreground" />}
        title="Keine kodierten Datensätze"
        description="Kodiere deinen ersten Kundendatensatz, um ihn sicher in Dokumenten und KI-Prompts zu verwenden."
        action={
          <Button onClick={onNeuErstellen}>Ersten Datensatz kodieren</Button>
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Adresse</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="hidden lg:table-cell">Notizen</TableHead>
              <TableHead className="hidden sm:table-cell">Erstellt am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daten.map((datensatz) => (
              <TableRow key={datensatz.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-xs tracking-wider">
                      {datensatz.code}
                    </Badge>
                    <CopyButton code={datensatz.code} />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{datensatz.name}</TableCell>
                <TableCell className="hidden max-w-[200px] truncate text-muted-foreground md:table-cell">
                  {datensatz.adresse ?? '–'}
                </TableCell>
                <TableCell>
                  {datensatz.tags && datensatz.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {datensatz.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => onTagFilter(tag)}
                          title={`Nach "${tag}" filtern`}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
                          style={{ backgroundColor: tagColor(tag) }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                <TableCell className="hidden max-w-[150px] truncate text-muted-foreground lg:table-cell">
                  {datensatz.notizen ?? '–'}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                  {format(new Date(datensatz.created_at), 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setDetailDatensatz(datensatz)}
                      title="Details anzeigen"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setLoeschenId(datensatz.id)}
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <KodierungDetailDialog
        datensatz={detailDatensatz}
        open={detailDatensatz !== null}
        onOpenChange={(open) => {
          if (!open) setDetailDatensatz(null);
        }}
        onTagFilter={onTagFilter}
      />

      <ConfirmDialog
        open={loeschenId !== null}
        onOpenChange={(open) => { if (!open) setLoeschenId(null); }}
        title="Datensatz löschen?"
        description="Der Datensatz wird unwiderruflich gelöscht. Dokumente, die diesen Code verwenden, können nicht mehr dekodiert werden."
        confirmText="Löschen"
        cancelText="Abbrechen"
        destructive
        isLoading={loeschenLaeuft}
        onConfirm={handleLoeschen}
      />
    </>
  );
}
