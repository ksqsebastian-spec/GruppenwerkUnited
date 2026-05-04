'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { STATUS_CONFIG, PRIORITAET_CONFIG } from '@/lib/leads/farben';
import { useCreateLead } from '@/hooks/use-leads';
import type { LeadStatus, LeadPrioritaet, LeadInsert } from '@/types';

interface LeadErstellenDialogProps {
  onClose: () => void;
}

export function LeadErstellenDialog({ onClose }: LeadErstellenDialogProps): React.JSX.Element {
  const [form, setForm] = useState<Partial<LeadInsert>>({
    status: 'neu',
    prioritaet: 'mittel',
    tags: [],
  });
  const create = useCreateLead();

  const handleSubmit = (): void => {
    if (!form.vorname && !form.firma) return;
    create.mutate(
      {
        vorname: form.vorname ?? '',
        nachname: form.nachname ?? '',
        email: form.email ?? null,
        telefon: form.telefon ?? null,
        firma: form.firma ?? null,
        position: form.position ?? null,
        linkedin_url: form.linkedin_url ?? null,
        stadt: form.stadt ?? null,
        land: form.land ?? null,
        branche: form.branche ?? null,
        status: (form.status as LeadStatus) ?? 'neu',
        prioritaet: (form.prioritaet as LeadPrioritaet) ?? 'mittel',
        tags: form.tags ?? [],
        notizen: form.notizen ?? null,
        naechste_aktion: form.naechste_aktion ?? null,
        letzter_kontakt: null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <h2 className="text-lg font-semibold text-[#000]">Neuer Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            <X className="h-4 w-4 text-[#737373]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#a3a3a3]">Pflichtfeld: Vorname oder Firma</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Vorname</label>
              <Input
                value={form.vorname ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, vorname: e.target.value }))}
                placeholder="Max"
                className="h-9 rounded-lg border-[#e5e5e5] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Nachname</label>
              <Input
                value={form.nachname ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nachname: e.target.value }))}
                placeholder="Mustermann"
                className="h-9 rounded-lg border-[#e5e5e5] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Firma</label>
            <Input
              value={form.firma ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, firma: e.target.value }))}
              placeholder="Muster GmbH"
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Position</label>
            <Input
              value={form.position ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="CEO"
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">E-Mail</label>
            <Input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="max@muster.de"
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Telefon</label>
            <Input
              value={form.telefon ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
              placeholder="+49 40 1234567"
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">LinkedIn URL</label>
            <Input
              value={form.linkedin_url ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Ort</label>
              <Input
                value={form.stadt ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, stadt: e.target.value }))}
                placeholder="Hamburg"
                className="h-9 rounded-lg border-[#e5e5e5] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Land</label>
              <Input
                value={form.land ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, land: e.target.value }))}
                placeholder="Deutschland"
                className="h-9 rounded-lg border-[#e5e5e5] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Branche</label>
            <Input
              value={form.branche ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, branche: e.target.value }))}
              placeholder="Software / IT"
              className="h-9 rounded-lg border-[#e5e5e5] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Status</label>
              <select
                value={form.status ?? 'neu'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LeadStatus }))}
                className="w-full h-9 rounded-lg border border-[#e5e5e5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#000]"
              >
                {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Priorität</label>
              <select
                value={form.prioritaet ?? 'mittel'}
                onChange={(e) => setForm((f) => ({ ...f, prioritaet: e.target.value as LeadPrioritaet }))}
                className="w-full h-9 rounded-lg border border-[#e5e5e5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#000]"
              >
                {(Object.entries(PRIORITAET_CONFIG) as [LeadPrioritaet, typeof PRIORITAET_CONFIG[LeadPrioritaet]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Notizen</label>
            <textarea
              value={form.notizen ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notizen: e.target.value }))}
              rows={3}
              placeholder="Erste Notizen..."
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#000]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg">Abbrechen</Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || (!form.vorname && !form.firma)}
            className="rounded-lg bg-[#000] text-white hover:bg-[#262626]"
          >
            {create.isPending ? 'Wird angelegt…' : 'Lead anlegen'}
          </Button>
        </div>
      </div>
    </div>
  );
}
