import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ConsultingStatusBadge } from './consulting-status-badge';
import type { ConsultingCompanyWithCounts } from '@/types';

interface ConsultingCompanyCardProps {
  company: ConsultingCompanyWithCounts;
}

export function ConsultingCompanyCard({
  company,
}: ConsultingCompanyCardProps): React.JSX.Element {
  const pct =
    company.total_count > 0
      ? Math.round((company.green_count / company.total_count) * 100)
      : 0;

  const lastUpdated = company.last_updated
    ? formatDistanceToNow(new Date(company.last_updated), { addSuffix: true, locale: de })
    : null;

  return (
    <Link href={`/consulting/${company.slug}`}>
      <div className="group relative flex flex-col gap-4 rounded-xl border border-[#e5e5e5] bg-white p-5 transition-all hover:border-[#c8c8c8] hover:shadow-sm cursor-pointer overflow-hidden">
        {/* Farbiger Akzent-Streifen links */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: company.color ?? '#6B7280' }}
        />

        {/* Unternehmensname */}
        <div className="pl-3">
          <p className="text-[13px] font-semibold text-[#000000] leading-tight">{company.name}</p>
        </div>

        {/* Status-Zähler */}
        <div className="pl-3 flex items-center gap-3 flex-wrap">
          <ConsultingStatusBadge status="green" count={company.green_count} />
          <ConsultingStatusBadge status="orange" count={company.orange_count} />
          <ConsultingStatusBadge status="red" count={company.red_count} />
        </div>

        {/* Fortschrittsbalken */}
        <div className="pl-3">
          <div className="h-1 w-full rounded-full bg-[#f0f0f0] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: '#22C55E',
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[#a3a3a3] tabular-nums">{pct}% abgeschlossen</p>
        </div>

        {/* Kosten & Timestamp */}
        <div className="pl-3 flex items-center justify-between gap-2">
          {company.total_cost > 0 && (
            <span className="text-[11px] text-[#737373] tabular-nums">
              {company.total_cost.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              })}
              /Monat
            </span>
          )}
          {lastUpdated && (
            <span className="ml-auto text-[10px] text-[#a3a3a3]">{lastUpdated}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
