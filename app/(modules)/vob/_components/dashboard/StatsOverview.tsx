'use client'

import { formatDate } from '@/lib/utils'
import type { VobScan } from '@/lib/modules/vob/types'

interface StatsOverviewProps {
  latestScan: VobScan | null
  totalActive: number
  totalMatched: number
  totalTenders: number
}

export function StatsOverview({ latestScan, totalActive, totalMatched, totalTenders }: StatsOverviewProps): React.JSX.Element {
  const items = [
    {
      label: 'Letzter Scan',
      value: latestScan ? `KW ${latestScan.calendar_week}` : '—',
      sub: latestScan ? formatDate(latestScan.scan_date) : 'Kein Scan vorhanden',
    },
    {
      label: 'Ausschreibungen gesamt',
      value: String(totalTenders),
      sub: 'Im System erfasst',
    },
    {
      label: 'Aktive Ausschreibungen',
      value: String(totalActive),
      sub: 'Mit offener Frist',
    },
    {
      label: 'Zuordnungen',
      value: String(totalMatched),
      sub: 'Unternehmen-Matches',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
      {items.map(item => (
        <div key={item.label} className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">{item.label}</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight">{item.value}</p>
          <p className="text-xs text-muted-foreground mt-2">{item.sub}</p>
        </div>
      ))}
    </div>
  )
}
