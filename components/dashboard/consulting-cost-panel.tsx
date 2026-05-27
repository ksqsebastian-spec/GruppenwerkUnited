'use client';

import { X } from 'lucide-react';
import type { ConsultingCompanyWithCounts, ConsultingCategoryWithCheckpoints } from '@/types';

type Props =
  | { mode: 'dashboard'; onClose: () => void; companies: ConsultingCompanyWithCounts[] }
  | {
      mode: 'company';
      onClose: () => void;
      categories: ConsultingCategoryWithCheckpoints[];
      companyName: string;
    };

function fmt(v: number): string {
  return v.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

export function ConsultingCostPanel(props: Props): React.JSX.Element {
  if (props.mode === 'dashboard') {
    const { companies, onClose } = props;
    const total = companies.reduce((s, c) => s + c.total_cost, 0);

    return (
      <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
          <h3 className="text-[13px] font-semibold text-[#000000]">Kostenübersicht</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f0f0]">
              <th className="text-left px-4 py-2 text-[11px] text-[#a3a3a3] font-medium">
                Unternehmen
              </th>
              <th className="text-right px-4 py-2 text-[11px] text-[#a3a3a3] font-medium">
                Monatlich
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((co) => (
              <tr key={co.id} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: co.color ?? '#6B7280' }}
                    />
                    <span className="text-[12px] text-[#1a1a1a]">{co.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-[12px] text-[#404040] tabular-nums">
                  {co.total_cost > 0 ? (
                    fmt(co.total_cost)
                  ) : (
                    <span className="text-[#c0c0c0]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#e5e5e5] bg-[#fafafa]">
              <td className="px-4 py-2.5 text-[12px] font-semibold text-[#000000]">Gesamt</td>
              <td className="px-4 py-2.5 text-right text-[12px] font-semibold text-[#000000] tabular-nums">
                {fmt(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  const { categories, companyName, onClose } = props;
  const grandTotal = categories
    .flatMap((cat) => cat.checkpoints)
    .reduce((s, cp) => s + (cp.status_row?.cost_monthly ?? 0), 0);

  return (
    <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#000000]">Kosten</h3>
          <p className="text-[11px] text-[#a3a3a3]">{companyName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-240px)]">
        {categories.map((cat) => {
          const rows = cat.checkpoints.filter(
            (cp) => cp.status_row?.cost_monthly && cp.status_row.cost_monthly > 0
          );
          if (rows.length === 0) return null;
          const catTotal = rows.reduce((s, cp) => s + (cp.status_row?.cost_monthly ?? 0), 0);
          return (
            <div key={cat.id} className="border-b border-[#f0f0f0]">
              <div className="px-4 py-2 bg-[#fafafa] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#404040] uppercase tracking-wide">
                  {cat.name}
                </span>
                <span className="text-[11px] text-[#737373] tabular-nums">{fmt(catTotal)}</span>
              </div>
              {rows.map((cp) => (
                <div key={cp.id} className="px-4 py-2 flex items-start gap-3 hover:bg-[#fafafa]">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#1a1a1a] leading-tight">{cp.label}</p>
                    {cp.status_row?.responsible && (
                      <p className="text-[11px] text-[#a3a3a3] mt-0.5">
                        {cp.status_row.responsible}
                      </p>
                    )}
                  </div>
                  <span className="text-[12px] text-[#404040] tabular-nums shrink-0">
                    {fmt(cp.status_row?.cost_monthly ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {grandTotal === 0 && (
          <p className="px-4 py-6 text-[12px] text-[#a3a3a3] text-center">
            Keine Kostendaten erfasst.
          </p>
        )}
      </div>

      {grandTotal > 0 && (
        <div className="border-t border-[#e5e5e5] px-4 py-3 bg-[#fafafa] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#000000]">Gesamt / Monat</span>
          <span className="text-[13px] font-semibold text-[#000000] tabular-nums">
            {fmt(grandTotal)}
          </span>
        </div>
      )}
    </div>
  );
}
