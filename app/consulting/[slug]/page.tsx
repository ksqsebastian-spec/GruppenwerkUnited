'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsultingStatusBadge } from '@/components/dashboard/consulting-status-badge';
import { ConsultingCategorySection } from '@/components/dashboard/consulting-category-section';
import { ConsultingCostPanel } from '@/components/dashboard/consulting-cost-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { useConsultingCompany } from '@/hooks/use-consulting-company';
import { useConsultingCompanies } from '@/hooks/use-consulting-companies';
import type { ConsultingCategoryWithCheckpoints, ConsultingCompanyWithCounts } from '@/types';

export default function ConsultingCompanyPage(): React.JSX.Element {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : String(params.slug ?? '');

  const { data: categories, isLoading, error } = useConsultingCompany(slug);
  const { data: companies } = useConsultingCompanies();
  const [showCosts, setShowCosts] = useState(false);

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
          <Button
            size="sm"
            variant={showCosts ? 'default' : 'outline'}
            onClick={() => setShowCosts((v) => !v)}
            className="flex items-center gap-1.5"
          >
            <Euro className="h-3.5 w-3.5" />
            Kosten
          </Button>
          <Link href="/consulting/einstellungen">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Kategorie
            </Button>
          </Link>
        </div>
      </div>

      {/* Main area */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          {!categories || categories.length === 0 ? (
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
          )}
        </div>

        {showCosts && categories && categories.length > 0 && (
          <div className="w-72 shrink-0 sticky top-4">
            <ConsultingCostPanel
              mode="company"
              categories={categories}
              companyName={company?.name ?? slug}
              onClose={() => setShowCosts(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
