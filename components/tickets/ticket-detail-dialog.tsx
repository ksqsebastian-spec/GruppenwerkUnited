'use client';

import { useState, useRef } from 'react';
import { X, Trash2, Upload, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useUpdateTicket,
  useDeleteTicket,
  useTicketDateien,
  useUploadTicketDatei,
  useDeleteTicketDatei,
} from '@/hooks/use-tickets';
import { URGENCY_CONFIG, STATUS_CONFIG, firmaName } from '@/lib/tickets/config';
import type { Ticket, Person, TicketUrgency, TicketStatus } from '@/types';

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  personen: Person[];
  onClose: () => void;
}

const LABEL = 'text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5';
const FELD = 'w-full h-9 rounded-lg border border-[#e5e5e5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#000]';

function formatGroesse(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function TicketDetailDialog({ ticket, personen, onClose }: TicketDetailDialogProps): React.JSX.Element | null {
  const update = useUpdateTicket();
  const del = useDeleteTicket();
  const { data: dateien = [] } = useTicketDateien(ticket?.id ?? null);
  const upload = useUploadTicketDatei();
  const deleteDatei = useDeleteTicketDatei();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bestaetigeLoeschen, setBestaetigeLoeschen] = useState(false);

  if (!ticket) return null;

  const handleStatus = (status: TicketStatus): void => {
    update.mutate({ id: ticket.id, update: { status } });
  };
  const handleUrgency = (urgency: TicketUrgency): void => {
    update.mutate({ id: ticket.id, update: { urgency } });
  };
  const handleAssignee = (assignee_person_id: string): void => {
    update.mutate({ id: ticket.id, update: { assignee_person_id: assignee_person_id || null } });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) upload.mutate({ ticketId: ticket.id, file });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDownload = async (dateiId: string): Promise<void> => {
    const res = await fetch(`/api/tickets/${ticket.id}/dateien/${dateiId}`);
    if (res.ok) {
      const { url } = (await res.json()) as { url: string };
      window.open(url, '_blank');
    }
  };

  const handleLoeschen = (): void => {
    del.mutate(ticket.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#f0f0f0] gap-4">
          <h2 className="text-lg font-semibold text-[#000] leading-snug">{ticket.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors shrink-0">
            <X className="h-4 w-4 text-[#737373]" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {ticket.description && (
            <p className="text-sm text-[#525252] whitespace-pre-wrap">{ticket.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Status</label>
              <select value={ticket.status} onChange={(e) => handleStatus(e.target.value as TicketStatus)} className={FELD}>
                {(Object.entries(STATUS_CONFIG) as [TicketStatus, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Dringlichkeit</label>
              <select value={ticket.urgency} onChange={(e) => handleUrgency(e.target.value as TicketUrgency)} className={FELD}>
                {(Object.entries(URGENCY_CONFIG) as [TicketUrgency, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Person</label>
            <select value={ticket.assignee_person_id ?? ''} onChange={(e) => handleAssignee(e.target.value)} className={FELD}>
              <option value="">— Niemandem zugewiesen —</option>
              {personen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.company ? ` (${firmaName(p.company)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className={LABEL}>Firma</label>
              <p className="text-[#525252]">{firmaName(ticket.firma)}</p>
            </div>
            <div>
              <label className={LABEL}>Fällig am</label>
              <p className="text-[#525252]">
                {ticket.due_date
                  ? new Date(ticket.due_date).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Dateianhänge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={LABEL + ' mb-0'}>Dateien</label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-[#000] hover:bg-[#f5f5f5] rounded-lg px-2 py-1 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {upload.isPending ? 'Lädt…' : 'Hochladen'}
              </button>
              <input
                ref={fileRef}
                type="file"
                onChange={handleUpload}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"
                className="hidden"
              />
            </div>
            {dateien.length === 0 ? (
              <p className="text-xs text-[#a3a3a3]">Noch keine Dateien angehängt.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {dateien.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 rounded-lg border border-[#f0f0f0] px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4 text-[#a3a3a3] shrink-0" />
                    <span className="flex-1 truncate text-[#525252]">{d.dateiname}</span>
                    <span className="text-[11px] text-[#a3a3a3]">{formatGroesse(d.dateigroesse)}</span>
                    <button
                      onClick={() => handleDownload(d.id)}
                      className="p-1 rounded hover:bg-[#f5f5f5] text-[#737373]"
                      title="Herunterladen"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteDatei.mutate({ ticketId: ticket.id, dateiId: d.id })}
                      className="p-1 rounded hover:bg-[#fee2e2] text-[#737373] hover:text-[#c0392b]"
                      title="Löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-between items-center gap-2">
          {bestaetigeLoeschen ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373]">Wirklich löschen?</span>
              <Button variant="outline" size="sm" onClick={() => setBestaetigeLoeschen(false)} className="rounded-lg">
                Nein
              </Button>
              <Button
                size="sm"
                onClick={handleLoeschen}
                disabled={del.isPending}
                className="rounded-lg bg-[#c0392b] hover:bg-[#a93226]"
              >
                Ja, löschen
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setBestaetigeLoeschen(true)}
              className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#c0392b] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Ticket löschen
            </button>
          )}
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
