'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STATUS_CONFIG, PRIORITAET_CONFIG } from '@/lib/leads/farben';
import type { LeadsFilter } from '@/hooks/use-leads';
import type { LeadStatus, LeadPrioritaet } from '@/types';

interface LeadFilterBarProps {
  filter: LeadsFilter;
  onChange: (filter: LeadsFilter) => void;
  branchen: string[];
}

export function LeadFilterBar({ filter, onChange, branchen }: LeadFilterBarProps): React.JSX.Element {
  const hatFilter = !!(filter.status || filter.prioritaet || filter.branche);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Suche */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a3a3a3]" />
        <Input
          placeholder="Name, E-Mail, Firma..."
          value={filter.search ?? ''}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
          className="pl-8 h-9 text-sm rounded-lg border-[#e5e5e5] bg-white"
        />
      </div>

      {/* Status */}
      <select
        value={filter.status ?? ''}
        onChange={(e) => onChange({ ...filter, status: e.target.value || undefined })}
        className="h-9 rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#262626] focus:outline-none focus:ring-2 focus:ring-[#000] focus:ring-offset-0"
      >
        <option value="">Alle Status</option>
        {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
        ))}
      </select>

      {/* Priorität */}
      <select
        value={filter.prioritaet ?? ''}
        onChange={(e) => onChange({ ...filter, prioritaet: e.target.value || undefined })}
        className="h-9 rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#262626] focus:outline-none focus:ring-2 focus:ring-[#000] focus:ring-offset-0"
      >
        <option value="">Alle Prioritäten</option>
        {(Object.keys(PRIORITAET_CONFIG) as LeadPrioritaet[]).map((p) => (
          <option key={p} value={p}>{PRIORITAET_CONFIG[p].label}</option>
        ))}
      </select>

      {/* Branche */}
      {branchen.length > 0 && (
        <select
          value={filter.branche ?? ''}
          onChange={(e) => onChange({ ...filter, branche: e.target.value || undefined })}
          className="h-9 rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#262626] focus:outline-none focus:ring-2 focus:ring-[#000] focus:ring-offset-0"
        >
          <option value="">Alle Branchen</option>
          {branchen.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}

      {/* Filter zurücksetzen */}
      {hatFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: filter.search })}
          className="h-9 px-2 text-[#737373] hover:text-[#000]"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Filter löschen
        </Button>
      )}
    </div>
  );
}
