'use client'

import { formatFaktor, formatRendite } from '@/lib/modules/immo/utils'

interface StatsOverviewProps {
  dealCount: number
  avgFaktor: number | null
  avgRendite: number | null
  cityCount: number
}

export function StatsOverview({ dealCount, avgFaktor, avgRendite, cityCount }: StatsOverviewProps): React.JSX.Element {
  const items = [
    {
      label: 'Deals (Faktor ≤ 20)',
      value: String(dealCount),
      sub: 'Objekte unter Schwelle',
    },
    {
      label: 'Ø Faktor',
      value: formatFaktor(avgFaktor),
      sub: 'Kaufpreisfaktor',
    },
    {
      label: 'Ø Rendite',
      value: formatRendite(avgRendite),
      sub: 'Bruttorendite',
    },
    {
      label: 'Städte',
      value: String(cityCount),
      sub: 'Beobachtete Regionen',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
      {items.map(item => (
        <div key={item.label} className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">{item.label}</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">{item.value}</p>
          <p className="text-xs text-muted-foreground mt-2">{item.sub}</p>
        </div>
      ))}
    </div>
  )
}
