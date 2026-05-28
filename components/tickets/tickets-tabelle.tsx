'use client';

import { TicketUrgencyBadge } from './ticket-urgency-badge';
import { TicketStatusBadge } from './ticket-status-badge';
import { firmaName } from '@/lib/tickets/config';
import type { Ticket, Person } from '@/types';

interface TicketsTabelleProps {
  tickets: Ticket[];
  personen: Person[];
  onTicketClick: (ticket: Ticket) => void;
}

function formatDatum(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function istUeberfaellig(ticket: Ticket): boolean {
  if (!ticket.due_date || ticket.status === 'erledigt') return false;
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  return new Date(ticket.due_date) < heute;
}

export function TicketsTabelle({ tickets, personen, onTicketClick }: TicketsTabelleProps): React.JSX.Element {
  const personMap = new Map(personen.map((p) => [p.id, p.name]));

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] text-left text-[11px] uppercase tracking-wider text-[#a3a3a3]">
            <th className="px-4 py-3 font-semibold">Aufgabe</th>
            <th className="px-4 py-3 font-semibold">Person</th>
            <th className="px-4 py-3 font-semibold">Firma</th>
            <th className="px-4 py-3 font-semibold">Dringlichkeit</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Fällig</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => onTicketClick(t)}
              className="border-b border-[#f0f0f0] last:border-0 cursor-pointer hover:bg-[#fafafa] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-[#000]">
                  <span className="truncate max-w-[280px]">{t.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#525252]">
                {t.assignee_person_id ? personMap.get(t.assignee_person_id) ?? '—' : '—'}
              </td>
              <td className="px-4 py-3 text-[#525252]">{firmaName(t.firma)}</td>
              <td className="px-4 py-3">
                <TicketUrgencyBadge urgency={t.urgency} />
              </td>
              <td className="px-4 py-3">
                <TicketStatusBadge status={t.status} />
              </td>
              <td className={`px-4 py-3 ${istUeberfaellig(t) ? 'text-[#c0392b] font-medium' : 'text-[#525252]'}`}>
                {formatDatum(t.due_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tickets.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-[#a3a3a3]">Keine Tickets in dieser Ansicht.</div>
      )}
    </div>
  );
}
