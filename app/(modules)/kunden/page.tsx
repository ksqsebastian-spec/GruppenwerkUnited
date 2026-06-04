'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Briefcase, Plus, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { KundenTabelle } from '@/components/kunden/kunden-tabelle';
import { KundeFormDialog } from '@/components/kunden/kunde-form-dialog';
import { STATUS_OPTIONS } from '@/components/kunden/kunde-status-badge';
import { useKunden } from '@/hooks/use-kunden';
import type { CustomerStatus } from '@/types';

type StatusFilter = CustomerStatus | 'alle';

export default function KundenPage(): React.JSX.Element {
  const [neu, setNeu] = useState(false);
  const [suche, setSuche] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');

  const { data: kunden = [], isLoading, error } = useKunden();

  const gefiltert = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return kunden.filter((k) => {
      if (statusFilter !== 'alle' && k.status !== statusFilter) return false;
      if (!s) return true;
      return (
        k.firmenname.toLowerCase().includes(s) ||
        (k.ansprechpartner ?? '').toLowerCase().includes(s) ||
        (k.email ?? '').toLowerCase().includes(s)
      );
    });
  }, [kunden, suche, statusFilter]);

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Kunden"
        description="Kundenakten mit Dateien, Kommentaren und Prompt-Vorlagen für Rechnung, Mahnung & Co."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/kunden/prompts">
                <Sparkles className="mr-2 h-4 w-4" /> Vorlagen
              </Link>
            </Button>
            <Button onClick={() => setNeu(true)}>
              <Plus className="mr-2 h-4 w-4" /> Neuer Kunde
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingSpinner text="Kunden werden geladen…" />
      ) : error ? (
        <ErrorState message="Kunden konnten nicht geladen werden" />
      ) : kunden.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12 text-muted-foreground" />}
          title="Noch keine Kunden"
          description="Lege deinen ersten Kunden an, um Dateien, Kommentare und Prompts zu verwalten."
          action={
            <Button onClick={() => setNeu(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ersten Kunden anlegen
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Suchen nach Firma, Ansprechpartner, E-Mail…"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              className="md:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
              <SelectTrigger className="md:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Status</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-sm text-muted-foreground">{gefiltert.length} von {kunden.length}</span>
          </div>

          {gefiltert.length === 0 ? (
            <EmptyState title="Keine Treffer" description="Andere Filter ausprobieren." />
          ) : (
            <KundenTabelle kunden={gefiltert} />
          )}
        </>
      )}

      <KundeFormDialog open={neu} onOpenChange={setNeu} />
    </div>
  );
}
