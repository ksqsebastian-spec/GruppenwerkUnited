'use client';

import { useState, useEffect } from 'react';
import { X, Linkedin, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { STATUS_CONFIG, PRIORITAET_CONFIG, tagFarbe, formatDatum } from '@/lib/leads/farben';
import { LeadAktivitaeten } from './lead-aktivitaeten';
import { useUpdateLead, useExportToDatenkodierung } from '@/hooks/use-leads';
import type { Lead, LeadStatus, LeadPrioritaet, LeadUpdate } from '@/types';

interface LeadDetailDialogProps {
  lead: Lead | null;
  onClose: () => void;
}

type Tab = 'details' | 'aktivitaeten';

export function LeadDetailDialog({ lead, onClose }: LeadDetailDialogProps): React.JSX.Element | null {
  const [tab, setTab] = useState<Tab>('details');
  const [form, setForm] = useState<LeadUpdate>({});
  const [neuerTag, setNeuerTag] = useState('');
  const [headerAufgeklappt, setHeaderAufgeklappt] = useState(true);
  const update = useUpdateLead();
  const exportDk = useExportToDatenkodierung();

  useEffect(() => {
    if (lead) {
      setForm({
        status: lead.status,
        prioritaet: lead.prioritaet,
        notizen: lead.notizen ?? '',
        naechste_aktion: lead.naechste_aktion ?? '',
        letzter_kontakt: lead.letzter_kontakt ?? '',
        tags: lead.tags,
      });
      setTab('details');
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = (): void => {
    update.mutate({ id: lead.id, update: form }, { onSuccess: onClose });
  };

  const handleTagHinzufuegen = (): void => {
    const tag = neuerTag.trim();
    if (!tag || form.tags?.includes(tag)) return;
    setForm((f) => ({ ...f, tags: [...(f.tags ?? []), tag] }));
    setNeuerTag('');
  };

  const handleTagEntfernen = (tag: string): void => {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
  };

  const name = [lead.vorname, lead.nachname].filter(Boolean).join(' ') || 'Unbekannt';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="border-b border-[#f0f0f0]">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <button
              onClick={() => setHeaderAufgeklappt((v) => !v)}
              className="flex-1 min-w-0 text-left flex items-center gap-2 group"
            >
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#000] truncate">{name}</h2>
                {!headerAufgeklappt && (
                  <p className="text-xs text-[#a3a3a3] mt-0.5 truncate">
                    {[lead.position, lead.firma].filter(Boolean).join(' · ') || lead.email || ''}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[#a3a3a3] group-hover:text-[#737373] transition-colors">
                {headerAufgeklappt
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors shrink-0">
              <X className="h-4 w-4 text-[#737373]" />
            </button>
          </div>

          {headerAufgeklappt && (
            <div className="px-6 pb-4 flex flex-col gap-1">
              <p className="text-sm text-[#737373]">
                {[lead.position, lead.firma].filter(Boolean).join(' · ') || '—'}
              </p>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="text-[12px] text-[#2563eb] hover:underline">
                    {lead.email}
                  </a>
                )}
                {lead.telefon && (
                  <a href={`tel:${lead.telefon}`} className="text-[12px] text-[#737373]">{lead.telefon}</a>
                )}
                {lead.linkedin_url && (
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] text-[#0a66c2] flex items-center gap-1 hover:underline">
                    <Linkedin className="h-3 w-3" />LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#f0f0f0] px-6">
          {(['details', 'aktivitaeten'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-0 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-[#000] text-[#000]'
                  : 'border-transparent text-[#737373] hover:text-[#000]'
              }`}
            >
              {t === 'details' ? 'Details' : 'Aktivitäten'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {tab === 'details' && (
            <div className="flex flex-col gap-5">

              {/* Status + Priorität */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Status</label>
                  <select
                    value={form.status ?? lead.status}
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
                    value={form.prioritaet ?? lead.prioritaet}
                    onChange={(e) => setForm((f) => ({ ...f, prioritaet: e.target.value as LeadPrioritaet }))}
                    className="w-full h-9 rounded-lg border border-[#e5e5e5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#000]"
                  >
                    {(Object.entries(PRIORITAET_CONFIG) as [LeadPrioritaet, typeof PRIORITAET_CONFIG[LeadPrioritaet]][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nächste Aktion */}
              <div>
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Nächste Aktion</label>
                <Input
                  value={form.naechste_aktion ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, naechste_aktion: e.target.value }))}
                  placeholder="z.B. Angebot bis Freitag senden"
                  className="h-9 rounded-lg border-[#e5e5e5] text-sm"
                />
              </div>

              {/* Letzter Kontakt */}
              <div>
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Letzter Kontakt</label>
                <Input
                  type="date"
                  value={form.letzter_kontakt ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, letzter_kontakt: e.target.value || null }))}
                  className="h-9 rounded-lg border-[#e5e5e5] text-sm"
                />
              </div>

              {/* Notizen */}
              <div>
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Notizen</label>
                <textarea
                  value={form.notizen ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notizen: e.target.value }))}
                  rows={4}
                  placeholder="Freie Notizen..."
                  className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#000]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(form.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-white"
                      style={{ backgroundColor: tagFarbe(tag) }}
                    >
                      {tag}
                      <button onClick={() => handleTagEntfernen(tag)} className="opacity-70 hover:opacity-100">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={neuerTag}
                    onChange={(e) => setNeuerTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagHinzufuegen(); } }}
                    placeholder="Tag hinzufügen..."
                    className="h-8 text-sm rounded-lg border-[#e5e5e5]"
                  />
                  <Button onClick={handleTagHinzufuegen} variant="outline" size="sm" className="h-8 rounded-lg">+</Button>
                </div>
              </div>

              {/* Kontaktinfos (read-only) */}
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-2">Kontaktdaten</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {[
                    ['Ort', lead.stadt],
                    ['Land', lead.land],
                    ['Branche', lead.branche],
                    ['Erstellt', formatDatum(lead.created_at)],
                  ].map(([label, val]) => val ? (
                    <div key={label as string}>
                      <span className="text-[#a3a3a3] text-xs">{label}</span>
                      <p className="text-[#262626] text-[13px]">{val}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>
          )}

          {tab === 'aktivitaeten' && (
            <LeadAktivitaeten leadId={lead.id} />
          )}
        </div>

        {/* Footer */}
        {tab === 'details' && (
          <div className="px-6 py-4 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportDk.mutate(lead.id, {
                  onSuccess: (res) => toast.success(`In Datenkodierung exportiert — Code: ${res.code}`),
                  onError: (e) => toast.error(e.message),
                });
              }}
              disabled={exportDk.isPending}
              className="rounded-lg text-sm h-9"
              title="Als Datenkodierung-Eintrag mit Tag 'CRM-Lead' speichern"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              {exportDk.isPending ? 'Wird exportiert…' : 'In Datenkodierung'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-lg">Abbrechen</Button>
              <Button
                onClick={handleSave}
                disabled={update.isPending}
                className="rounded-lg bg-[#000] text-white hover:bg-[#262626]"
              >
                {update.isPending ? 'Wird gespeichert…' : 'Speichern'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
