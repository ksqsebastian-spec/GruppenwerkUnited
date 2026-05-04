'use client';

import { useState, useRef } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, ExternalLink } from 'lucide-react';
import { STATUS_CONFIG, PRIORITAET_CONFIG, tagFarbe, formatDatum } from '@/lib/leads/farben';
import { useUpdateLead, useDeleteLead } from '@/hooks/use-leads';
import type { Lead, LeadStatus } from '@/types';

type SortKey = 'name' | 'firma' | 'status' | 'prioritaet' | 'letzter_kontakt' | 'created_at';

interface LeadsTabelleProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

function SortHeader({
  label, sortKey, aktiv, richtung, onClick,
}: {
  label: string; sortKey: SortKey; aktiv: SortKey; richtung: 'asc' | 'desc'; onClick: (k: SortKey) => void;
}): React.JSX.Element {
  const isAktiv = aktiv === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold text-[#737373] uppercase tracking-wider hover:text-[#000] transition-colors"
    >
      {label}
      {isAktiv
        ? richtung === 'asc'
          ? <ArrowUp className="h-3 w-3" />
          : <ArrowDown className="h-3 w-3" />
        : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

function StatusPill({ lead }: { lead: Lead }): React.JSX.Element {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const update = useUpdateLead();
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.neu;

  const handleSelect = (s: LeadStatus): void => {
    update.mutate({ id: lead.id, update: { status: s } });
    setOffen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOffen(!offen); }}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity hover:opacity-80"
        style={{ color: cfg.farbe, backgroundColor: cfg.hintergrund }}
      >
        {cfg.label}
      </button>
      {offen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOffen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-[#e5e5e5] shadow-lg py-1 min-w-max">
            {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([key, s]) => (
              <button
                key={key}
                onClick={(e) => { e.stopPropagation(); handleSelect(key); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] transition-colors"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.farbe }}
                />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LeadsTabelle({ leads, onLeadClick }: LeadsTabelleProps): React.JSX.Element {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [richtung, setRichtung] = useState<'asc' | 'desc'>('desc');
  const deleteLead = useDeleteLead();

  const handleSort = (key: SortKey): void => {
    if (key === sortKey) setRichtung(r => r === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setRichtung('asc'); }
  };

  const sorted = [...leads].sort((a, b) => {
    let va = '', vb = '';
    if (sortKey === 'name') { va = `${a.nachname}${a.vorname}`; vb = `${b.nachname}${b.vorname}`; }
    else if (sortKey === 'firma') { va = a.firma ?? ''; vb = b.firma ?? ''; }
    else if (sortKey === 'status') { va = a.status; vb = b.status; }
    else if (sortKey === 'prioritaet') {
      const order = { hoch: 0, mittel: 1, niedrig: 2 };
      const diff = (order[a.prioritaet] ?? 1) - (order[b.prioritaet] ?? 1);
      return richtung === 'asc' ? diff : -diff;
    }
    else if (sortKey === 'letzter_kontakt') { va = a.letzter_kontakt ?? ''; vb = b.letzter_kontakt ?? ''; }
    else { va = a.created_at; vb = b.created_at; }
    const cmp = va.localeCompare(vb, 'de');
    return richtung === 'asc' ? cmp : -cmp;
  });

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white py-20 text-center text-sm text-[#a3a3a3]">
        Keine Leads gefunden.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
              <th className="w-6 px-4 py-3" />
              <th className="px-4 py-3 text-left">
                <SortHeader label="Name" sortKey="name" aktiv={sortKey} richtung={richtung} onClick={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Firma" sortKey="firma" aktiv={sortKey} richtung={richtung} onClick={handleSort} />
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">Position</span>
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">E-Mail</span>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Status" sortKey="status" aktiv={sortKey} richtung={richtung} onClick={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Priorität" sortKey="prioritaet" aktiv={sortKey} richtung={richtung} onClick={handleSort} />
              </th>
              <th className="px-4 py-3 text-left hidden xl:table-cell">
                <SortHeader label="Letzter Kontakt" sortKey="letzter_kontakt" aktiv={sortKey} richtung={richtung} onClick={handleSort} />
              </th>
              <th className="px-4 py-3 text-left hidden xl:table-cell">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">Tags</span>
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {sorted.map((lead) => {
              const pCfg = PRIORITAET_CONFIG[lead.prioritaet];
              return (
                <tr
                  key={lead.id}
                  onClick={() => onLeadClick(lead)}
                  className="hover:bg-[#fafafa] cursor-pointer transition-colors group"
                >
                  {/* Priorität-Punkt */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: pCfg?.farbe ?? '#a3a3a3' }}
                      title={pCfg?.label}
                    />
                  </td>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#000]">
                      {[lead.vorname, lead.nachname].filter(Boolean).join(' ') || '—'}
                    </span>
                    {lead.naechste_aktion && (
                      <p className="text-[11px] text-[#a3a3a3] mt-0.5 truncate max-w-[180px]">
                        → {lead.naechste_aktion}
                      </p>
                    )}
                  </td>
                  {/* Firma */}
                  <td className="px-4 py-3 text-[#525252]">{lead.firma ?? '—'}</td>
                  {/* Position */}
                  <td className="px-4 py-3 text-[#737373] hidden md:table-cell">{lead.position ?? '—'}</td>
                  {/* E-Mail */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#2563eb] hover:underline text-xs"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-[#a3a3a3]">—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusPill lead={lead} />
                  </td>
                  {/* Priorität */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium" style={{ color: pCfg?.farbe }}>
                      {pCfg?.label ?? '—'}
                    </span>
                  </td>
                  {/* Letzter Kontakt */}
                  <td className="px-4 py-3 text-[#737373] text-xs hidden xl:table-cell">
                    {formatDatum(lead.letzter_kontakt)}
                  </td>
                  {/* Tags */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                          style={{ backgroundColor: tagFarbe(tag) }}
                        >
                          {tag}
                        </span>
                      ))}
                      {lead.tags.length > 3 && (
                        <span className="text-[10px] text-[#a3a3a3]">+{lead.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  {/* Aktionen */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {lead.linkedin_url && (
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-[#a3a3a3] hover:text-[#2563eb] transition-colors"
                          title="LinkedIn"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Lead wirklich löschen?')) deleteLead.mutate(lead.id);
                        }}
                        className="p-1 rounded text-[#a3a3a3] hover:text-[#dc2626] transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
