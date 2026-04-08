'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts'
import type { VobScan } from '@/lib/types'

interface ScanVolumeChartProps {
  scans: VobScan[]
}

export function ScanVolumeChart({ scans }: ScanVolumeChartProps) {
  const chartData = [...scans]
    .reverse()
    .map(scan => ({
      week: `KW${scan.calendar_week}`,
      gesamt: scan.total_listings ?? 0,
      matches: scan.matched_count ?? 0,
      neu: scan.new_listings ?? 0,
    }))

  if (chartData.length < 2) return null

  return (
    <div className="bg-white rounded-xl border border-neutral-200/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] font-medium text-neutral-900">Ausschreibungen pro Woche</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Gesamtvolumen, Matches und neue Einträge</p>
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#f5f5f5" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: '#a3a3a3' }}
              stroke="transparent"
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#a3a3a3' }}
              stroke="transparent"
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            />
            <Bar dataKey="gesamt" name="Gesamt" fill="#e5e5e5" radius={[3, 3, 0, 0]} />
            <Bar dataKey="matches" name="Matches" fill="#171717" radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="neu"
              name="Neu"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-5 mt-4">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-neutral-200" />
          Gesamt
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-neutral-900" />
          Matches
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Neu
        </span>
      </div>
    </div>
  )
}
