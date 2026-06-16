'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ImmoScan } from '@/lib/modules/immo/types'

interface TrendChartProps {
  scans: ImmoScan[]
}

type TimeFrame = 'week' | 'month' | '6months'

export function TrendChart({ scans }: TrendChartProps): React.JSX.Element {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month')

  // Scans absteigend (neueste zuerst) → für Chart aufsteigend sortieren
  const ordered = [...scans].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.calendar_week - b.calendar_week
  })

  const allChartData = ordered.map((scan) => ({
    week: `KW${scan.calendar_week}`,
    _gesamt: scan.total_listings ?? 0,
    _treffer: scan.matched_count ?? 0,
  }))

  const weekLimits: Record<TimeFrame, number> = {
    week: 1,
    month: 4,
    '6months': 26,
  }
  const chartData = allChartData.slice(-(weekLimits[timeFrame as TimeFrame] ?? 4))

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <p className="text-sm font-medium text-foreground mb-2">Trend</p>
        <p className="text-xs text-muted-foreground">Noch keine Trenddaten.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-foreground">Trend</p>
        <div className="flex gap-px bg-muted rounded-lg p-px">
          {([
            ['week', 'Woche'],
            ['month', 'Monat'],
            ['6months', '6 Monate'],
          ] as [TimeFrame, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeFrame(key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                timeFrame === key
                  ? 'bg-card text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="immo-g-gesamt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A1916" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#1A1916" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="immo-g-treffer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(38 16% 87%)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: '#6B6860', fontFamily: 'var(--font-sans)' }}
              stroke="transparent"
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B6860', fontFamily: 'var(--font-sans)' }}
              stroke="transparent"
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '10px',
                border: '1px solid hsl(38 16% 87%)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 4px 16px rgba(26,25,22,0.06)',
                backgroundColor: '#ffffff',
                color: '#1A1916',
              }}
            />
            <Area
              type="monotone"
              dataKey="_gesamt"
              name="Inserate"
              stroke="#1A1916"
              strokeWidth={2}
              strokeDasharray="4 2"
              fill="url(#immo-g-gesamt)"
              dot={false}
              activeDot={{ r: 3, fill: '#1A1916', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="_treffer"
              name="Treffer"
              stroke="#2563EB"
              strokeWidth={1.5}
              fill="url(#immo-g-treffer)"
              dot={false}
              activeDot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
        <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
          <span className="w-4 h-px border-t-2 border-dashed border-foreground" />
          Inserate
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
          Treffer
        </span>
      </div>
    </div>
  )
}
