'use client';

import { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { TicketsTabelle } from '@/components/tickets/tickets-tabelle';
import { TicketErstellenDialog } from '@/components/tickets/ticket-erstellen-dialog';
import { TicketDetailDialog } from '@/components/tickets/ticket-detail-dialog';
import { PersonenVerwaltungDialog } from '@/components/tickets/personen-verwaltung-dialog';
import { WerBinIchAuswahl } from '@/components/tickets/wer-bin-ich-auswahl';
import { useTickets } from '@/hooks/use-tickets';
import { usePersonen } from '@/hooks/use-personen';
import { useAktuellePerson } from '@/hooks/use-aktuelle-person';
import { URGENCY_ORDER, FIRMEN } from '@/lib/tickets/config';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/types';

type Ansicht = 'fuer_mich' | 'andere' | 'alle';

const TABS: { id: Ansicht; label: string }[] = [
  { id: 'fuer_mich', label: 'Für mich' },
  { id: 'andere', label: 'Andere' },
  { id: 'alle', label: 'Alle' },
];

export default function TicketsPage(): React.JSX.Element {
  const [ansicht, setAnsicht] = useState<Ansicht>('alle');
  const [firmaFilter, setFirmaFilter] = useState('');
  const [erstellenOffen, setErstellenOffen] = useState(false);
  const [personenOffen, setPersonenOffen] = useState(false);
  const [ausgewaehlt, setAusgewaehlt] = useState<Ticket | null>(null);

  const { data: tickets = [], isLoading, error } = useTickets();
  const { data: personen = [] } = usePersonen();
  const [aktuellePerson] = useAktuellePerson();

  const gefiltert = useMemo(() => {
    let list = tickets;
    if (ansicht === 'fuer_mich') {
      list = aktuellePerson ? tickets.filter((t) => t.assignee_person_id === aktuellePerson) : [];
    } else if (ansicht === 'andere') {
      list = tickets.filter((t) => t.assignee_person_id !== aktuellePerson);
    }
    if (firmaFilter) {
      list = list.filter((t) => t.firma === firmaFilter);
    }
    return [...list].sort((a, b) => {
      if (a.status === 'erledigt' && b.status !== 'erledigt') return 1;
      if (b.status === 'erledigt' && a.status !== 'erledigt') return -1;
      // Primär nach Firma gruppieren, dann nach Dringlichkeit
      const fa = a.firma ?? '';
      const fb = b.firma ?? '';
      if (fa !== fb) return fa.localeCompare(fb, 'de');
      return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    });
  }, [tickets, ansicht, aktuellePerson, firmaFilter]);

  // aktuelles Ticket aus der Liste lesen, damit Detail-Dialog Updates live zeigt
  const aktuellesTicket = ausgewaehlt ? tickets.find((t) => t.id === ausgewaehlt.id) ?? null : null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
        <PageHeader title="Tickets" description="Aufgaben erstellen, zuweisen und nachverfolgen" />
        <LoadingSpinner text="Tickets werden geladen..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
        <PageHeader title="Tickets" description="Aufgaben erstellen, zuweisen und nachverfolgen" />
        <ErrorState message={error instanceof Error ? error.message : 'Tickets konnten nicht geladen werden.'} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Tickets" description="Aufgaben erstellen, zuweisen und nachverfolgen" />
        <div className="flex items-center gap-2 flex-wrap">
          <WerBinIchAuswahl />
          <Button variant="outline" size="sm" onClick={() => setPersonenOffen(true)} className="h-9 rounded-lg text-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Personen
          </Button>
          <Button size="sm" onClick={() => setErstellenOffen(true)} className="h-9 rounded-lg text-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Neues Ticket
          </Button>
        </div>
      </div>

      {/* Filter-Tabs + Firmen-Filter */}
      <div className="flex items-end justify-between gap-4 border-b border-[#f0f0f0] flex-wrap">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setAnsicht(t.id)}
              className={cn(
                'px-4 py-2 text-[13px] font-medium border-b-2 transition-colors',
                ansicht === t.id
                  ? 'border-[#000] text-[#000]'
                  : 'border-transparent text-[#a3a3a3] hover:text-[#000]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={firmaFilter}
          onChange={(e) => setFirmaFilter(e.target.value)}
          className="mb-1.5 h-8 rounded-lg border border-[#e5e5e5] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#000]"
        >
          <option value="">Alle Firmen</option>
          {FIRMEN.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {ansicht === 'fuer_mich' && !aktuellePerson ? (
        <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-white px-4 py-12 text-center text-sm text-[#737373]">
          Wähle oben rechts unter „Ich bin" deine Person aus, um deine Tickets zu sehen.
        </div>
      ) : (
        <TicketsTabelle tickets={gefiltert} personen={personen} onTicketClick={setAusgewaehlt} />
      )}

      {erstellenOffen && <TicketErstellenDialog onClose={() => setErstellenOffen(false)} />}
      {personenOffen && <PersonenVerwaltungDialog onClose={() => setPersonenOffen(false)} />}
      <TicketDetailDialog ticket={aktuellesTicket} personen={personen} onClose={() => setAusgewaehlt(null)} />
    </div>
  );
}
