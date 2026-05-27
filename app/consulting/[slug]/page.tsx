'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Euro, Users, Image, Globe, AppWindow, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConsultingStatusBadge } from '@/components/dashboard/consulting-status-badge';
import { ConsultingCategorySection } from '@/components/dashboard/consulting-category-section';
import { ConsultingCostPanel } from '@/components/dashboard/consulting-cost-panel';
import { ConsultingCredentialsTab } from '@/components/dashboard/consulting-credentials-tab';
import { ConsultingContactsPanel } from '@/components/dashboard/consulting-contacts-panel';
import { ConsultingBilderPanel } from '@/components/dashboard/consulting-bilder-panel';
import { ConsultingSocialsPanel } from '@/components/dashboard/consulting-socials-panel';
import { ConsultingSoftwarePanel } from '@/components/dashboard/consulting-software-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { useConsultingCompany } from '@/hooks/use-consulting-company';
import { useConsultingCompanies } from '@/hooks/use-consulting-companies';
import type { ConsultingCategoryWithCheckpoints, ConsultingCompanyWithCounts } from '@/types';

type Tab = 'checkpoints' | 'zugaenge';

interface PanelState {
  web: boolean;
  software: boolean;
  bilder: boolean;
  contacts: boolean;
  costs: boolean;
}

const STORAGE_KEY = 'consulting_panels';

const defaultPanels: PanelState = { web: false, software: false, bilder: false, contacts: false, costs: false };

function loadPanels(): PanelState {
  if (typeof window === 'undefined') return defaultPanels;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPanels, ...JSON.parse(stored) as Partial<PanelState> };
  } catch { /* ignore */ }
  return defaultPanels;
}

export default function ConsultingCompanyPage(): React.JSX.Element {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : String(params.slug ?? '');

  const { data: categories, isLoading, error } = useConsultingCompany(slug);
  const { data: companies } = useConsultingCompanies();

  const [tab, setTab] = useState<Tab>('checkpoints');
  const [panels, setPanels] = useState<PanelState>(defaultPanels);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);

  useEffect(() => { setPanels(loadPanels()); }, []);

  const togglePanel = (key: keyof PanelState): void => {
    setPanels((prev: PanelState) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const company = companies?.find((c: ConsultingCompanyWithCounts) => c.slug === slug);

  const totals = (categories ?? []).reduce(
    (
      acc: { green: number; orange: number; red: number },
      cat: ConsultingCategoryWithCheckpoints
    ) => ({
      green: acc.green + cat.green_count,
      orange: acc.orange + cat.orange_count,
      red: acc.red + cat.red_count,
    }),
    { green: 0, orange: 0, red: 0 }
  );
  const totalCount = totals.green + totals.orange + totals.red;
  const pct = totalCount > 0 ? Math.round((totals.green / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <EmptyState
          title="Daten konnten nicht geladen werden"
          description="Bitte Seite neu laden."
        />
      </div>
    );
  }

  const activePanels = [
    panels.web && { key: 'web' as const, icon: <Globe className="h-3.5 w-3.5" /> },
    panels.software && { key: 'software' as const, icon: <AppWindow className="h-3.5 w-3.5" /> },
    panels.bilder && { key: 'bilder' as const, icon: <Image className="h-3.5 w-3.5" /> },
    panels.contacts && { key: 'contacts' as const, icon: <Users className="h-3.5 w-3.5" /> },
    panels.costs && tab === 'checkpoints' && { key: 'costs' as const, icon: <Euro className="h-3.5 w-3.5" /> },
  ].filter(Boolean) as { key: keyof PanelState; icon: React.JSX.Element }[];

  const hasRightPanel =
    (panels.costs && tab === 'checkpoints' && categories && categories.length > 0) ||
    panels.contacts || panels.bilder || panels.web || panels.software;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/consulting">
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Übersicht
          </Button>
        </Link>
      </div>

      {/* Unternehmens-Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {company?.color && (
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: company.color }}
              />
            )}
            <h1 className="text-xl font-semibold text-[#000000] tracking-tight">
              {company?.name ?? slug}
            </h1>
          </div>
          <p className="text-xs text-[#a3a3a3]">
            {(categories ?? []).length} Kategorien · {pct}% abgeschlossen
          </p>
          <div className="flex items-center gap-4 mt-2">
            <ConsultingStatusBadge status="green" count={totals.green} />
            <ConsultingStatusBadge status="orange" count={totals.orange} />
            <ConsultingStatusBadge status="red" count={totals.red} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Active panel quick-toggle chips */}
          {activePanels.map(({ key, icon }) => (
            <Button
              key={key}
              size="sm"
              variant="default"
              onClick={() => togglePanel(key)}
              className="px-2"
              title={key}
            >
              {icon}
            </Button>
          ))}

          {/* Panel picker */}
          <Popover open={panelPickerOpen} onOpenChange={setPanelPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="px-2" title="Panels anpassen">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wide px-2 py-1 mb-1">Panels</p>
              {(
                [
                  { key: 'web' as const, label: 'Web', icon: <Globe className="h-3.5 w-3.5" /> },
                  { key: 'software' as const, label: 'Software', icon: <AppWindow className="h-3.5 w-3.5" /> },
                  { key: 'bilder' as const, label: 'Bilder', icon: <Image className="h-3.5 w-3.5" /> },
                  { key: 'contacts' as const, label: 'Ansprechpartner', icon: <Users className="h-3.5 w-3.5" /> },
                  ...(tab === 'checkpoints' ? [{ key: 'costs' as const, label: 'Kosten', icon: <Euro className="h-3.5 w-3.5" /> }] : []),
                ] as { key: keyof PanelState; label: string; icon: React.JSX.Element }[]
              ).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePanel(key)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] hover:bg-[#f5f5f5] transition-colors text-left"
                >
                  <span className={panels[key] ? 'text-[#000]' : 'text-[#c0c0c0]'}>{icon}</span>
                  <span className={panels[key] ? 'text-[#000] font-medium' : 'text-[#737373]'}>{label}</span>
                  {panels[key] && <Check className="h-3 w-3 text-[#000] ml-auto" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Link href="/consulting/einstellungen">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Kategorie
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab-Leiste */}
      <div className="flex items-center gap-1 border-b border-[#f0f0f0]">
        <button
          type="button"
          onClick={() => setTab('checkpoints')}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
            tab === 'checkpoints'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#a3a3a3] hover:text-[#000000]'
          }`}
        >
          Checkpoints
        </button>
        <button
          type="button"
          onClick={() => setTab('zugaenge')}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
            tab === 'zugaenge'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#a3a3a3] hover:text-[#000000]'
          }`}
        >
          Zugänge
        </button>
      </div>

      {/* Main area */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          {tab === 'checkpoints' ? (
            !categories || categories.length === 0 ? (
              <EmptyState
                title="Keine Kategorien vorhanden"
                description="In den Einstellungen können Kategorien und Checkpoints verwaltet werden."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map((category, i) => (
                  <ConsultingCategorySection
                    key={category.id}
                    category={category}
                    companySlug={slug}
                    colorIndex={i}
                  />
                ))}
              </div>
            )
          ) : (
            <ConsultingCredentialsTab companyId={company?.id} />
          )}
        </div>

        {hasRightPanel && (
          <div className="w-72 shrink-0 sticky top-4 flex flex-col gap-3">
            {panels.web && (
              <ConsultingSocialsPanel
                companyId={company?.id}
                companyName={company?.name ?? slug}
                onClose={() => togglePanel('web')}
              />
            )}
            {panels.software && (
              <ConsultingSoftwarePanel
                companyId={company?.id}
                companyName={company?.name ?? slug}
                onClose={() => togglePanel('software')}
              />
            )}
            {panels.bilder && (
              <ConsultingBilderPanel
                companyId={company?.id}
                companyName={company?.name ?? slug}
                onClose={() => togglePanel('bilder')}
              />
            )}
            {panels.contacts && (
              <ConsultingContactsPanel
                companyId={company?.id}
                companyName={company?.name ?? slug}
                onClose={() => togglePanel('contacts')}
              />
            )}
            {panels.costs && tab === 'checkpoints' && categories && categories.length > 0 && (
              <ConsultingCostPanel
                mode="company"
                categories={categories}
                companyName={company?.name ?? slug}
                onClose={() => togglePanel('costs')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
