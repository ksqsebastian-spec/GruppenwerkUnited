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
import type { CompanyTrend } from '@/lib/modules/vob/types'

interface TrendChartProps {
  trends: CompanyTrend[]
}

type TimeFrame = 'week' | 'month' | '6months'

export function TrendChart({ trends }: TrendChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month')

  const companyMap = new Map<string, { name: string; color: string }>()
  for (const t of trends) {
    if (!companyMap.has(t.company_slug)) {
      companyMap.set(t.company_slug, { name: t.company_name, color: t.color })
    }
  }

  const weekMap = new Map<string, Record<string, number>>()
  for (const t of trends) {
    const key = `KW${t.calendar_week}`
    if (!weekMap.has(key)) weekMap.set(key, {})
    weekMap.get(key)![t.company_slug] = t.tender_count
  }

  const allChartData = Array.from(weekMap.entries())
    .map(([week, data]) => {
      const total = Object.values(data).reduce((sum, v) => sum + v, 0)
      return { week, ...data, _gesamt: total }
    })
    .reverse()

  const weekLimits: Record<TimeFrame, number> = {
    week: 1,
    month: 4,
    '6months': 26,
  }
  const chartData = allChartData.slice(-weekLimits[timeFrame])

  const companies = Array.from(companyMap.entries())

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200/60 p-6">
        <p className="text-[13px] font-medium text-neutral-900 mb-2">Trend</p>
        <p className="text-[12px] text-neutral-400">Noch keine Trenddaten.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[13px] font-medium text-neutral-900">Trend</p>
        <div className="flex gap-px bg-neutral-100 rounded-lg p-px">
          {([
            ['week', 'Woche'],
            ['month', 'Monat'],
            ['6months', '6 Monate'],
          ] as [TimeFrame, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeFrame(key)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                timeFrame === key
                  ? 'bg-white text-neutral-900 shadow-sm font-medium'
                  : 'text-neutral-400 hover:text-neutral-600'
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
              <linearGradient id="g-gesamt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
              {companies.map(([slug, { color }]) => (
                <linearGradient key={slug} id={`g-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
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
              width={28}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            />
            <Area
              type="monotone"
              dataKey="_gesamt"
              name="Gesamt"
              stroke="#171717"
              strokeWidth={2}
              strokeDasharray="4 2"
              fill="url(#g-gesamt)"
              dot={false}
              activeDot={{ r: 3, fill: '#171717', strokeWidth: 0 }}
            />
            {companies.map(([slug, { name, color }]) => (
              <Area
                key={slug}
                type="monotone"
                dataKey={slug}
                name={name}
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#g-${slug})`}
                dot={false}
                activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-900 font-medium">
          <span className="w-4 h-px border-t-2 border-dashed border-neutral-900" />
          Gesamt
        </span>
        {companies.map(([slug, { name, color }]) => (
          <span key={slug} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
