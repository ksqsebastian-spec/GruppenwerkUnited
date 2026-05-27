'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTicket } from '@/hooks/use-tickets';
import { usePersonen } from '@/hooks/use-personen';
import { URGENCY_CONFIG, FIRMEN } from '@/lib/tickets/config';
import { firmaName } from '@/lib/tickets/config';
import type { TicketUrgency } from '@/types';

interface TicketErstellenDialogProps {
  onClose: () => void;
}

const LABEL = 'text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5';
const FELD = 'w-full h-9 rounded-lg border border-[#e5e5e5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#000]';

export function TicketErstellenDialog({ onClose }: TicketErstellenDialogProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [firma, setFirma] = useState('');
  const [urgency, setUrgency] = useState<TicketUrgency>('mittel');
  const [dueDate, setDueDate] = useState('');

  const { data: personen = [] } = usePersonen();
  const create = useCreateTicket();

  const handleSubmit = (): void => {
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        assignee_person_id: assignee || null,
        firma: firma || null,
        urgency,
        status: 'offen',
        due_date: dueDate || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <h2 className="text-lg font-semibold text-[#000]">Neues Ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            <X className="h-4 w-4 text-[#737373]" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={LABEL}>Aufgabe *</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Angebot für Dachsanierung erstellen"
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div>
            <label className={LABEL}>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Details zur Aufgabe…"
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#000]"
            />
          </div>

          <div>
            <label className={LABEL}>Person</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={FELD}>
              <option value="">— Niemandem zugewiesen —</option>
              {personen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.company ? ` (${firmaName(p.company)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Firma (Datenablage)</label>
              <select value={firma} onChange={(e) => setFirma(e.target.value)} className={FELD}>
                <option value="">— Keine —</option>
                {FIRMEN.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Dringlichkeit</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                className={FELD}
              >
                {(Object.entries(URGENCY_CONFIG) as [TicketUrgency, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Fällig am</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending || !title.trim()} className="rounded-lg">
            {create.isPending ? 'Wird angelegt…' : 'Ticket anlegen'}
          </Button>
        </div>
      </div>
    </div>
  );
}
