'use client';

import { useState, useMemo } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { LeadsTabelle } from '@/components/leads/leads-tabelle';
import { LeadFilterBar } from '@/components/leads/lead-filter-bar';
import { LeadDetailDialog } from '@/components/leads/lead-detail-dialog';
import { LeadErstellenDialog } from '@/components/leads/lead-erstellen-dialog';
import { LeadImportDialog } from '@/components/leads/lead-import-dialog';
import { useLeads, type LeadsFilter } from '@/hooks/use-leads';
import type { Lead } from '@/types';

export default function LeadsPage(): React.JSX.Element {
  const [filter, setFilter] = useState<LeadsFilter>({});
  const [ausgewaehlterLead, setAusgewaehlterLead] = useState<Lead | null>(null);
  const [erstellenOffen, setErstellenOffen] = useState(false);
  const [importOffen, setImportOffen] = useState(false);

  const { data: leads = [], isLoading, error } = useLeads(filter);

  const branchen = useMemo(() => {
    const set = new Set(leads.map((l) => l.branche).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
        <PageHeader
          title="B2B"
          description="Leads verwalten, qualifizieren und nachverfolgen"
        />
        <LoadingSpinner text="Leads werden geladen..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
        <PageHeader
          title="B2B"
          description="Leads verwalten, qualifizieren und nachverfolgen"
        />
        <ErrorState message="Leads konnten nicht geladen werden." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="B2B"
          description="Leads verwalten, qualifizieren und nachverfolgen"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOffen(true)}
            className="h-9 rounded-lg text-sm"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            CSV importieren
          </Button>
          <Button
            size="sm"
            onClick={() => setErstellenOffen(true)}
            className="h-9 rounded-lg bg-[#000] text-white hover:bg-[#262626] text-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Neuer Lead
          </Button>
        </div>
      </div>

      <LeadFilterBar filter={filter} onChange={setFilter} branchen={branchen} />

      <LeadsTabelle leads={leads} onLeadClick={setAusgewaehlterLead} />

      <LeadDetailDialog
        lead={ausgewaehlterLead}
        onClose={() => setAusgewaehlterLead(null)}
      />

      {erstellenOffen && (
        <LeadErstellenDialog onClose={() => setErstellenOffen(false)} />
      )}

      {importOffen && (
        <LeadImportDialog onClose={() => setImportOffen(false)} />
      )}
    </div>
  );
}
