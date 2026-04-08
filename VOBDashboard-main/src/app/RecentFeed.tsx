'use client'

import { useState } from 'react'
import { TenderDrawer } from '@/components/tenders/TenderDrawer'
import { daysUntilDeadline } from '@/lib/utils'
import type { DashboardRow } from '@/lib/types'

interface RecentFeedProps {
  tenders: DashboardRow[]
  latestScanDate?: string | null
}

export function RecentFeed({ tenders, latestScanDate }: RecentFeedProps) {
  const [selectedTender, setSelectedTender] = useState<DashboardRow | null>(null)

  const seen = new Set<string>()
  const uniqueTenders = tenders.filter(t => {
    if (seen.has(t.tender_id)) return false
    seen.add(t.tender_id)
    return true
  }).slice(0, 8)

  const allMatches = selectedTender
    ? tenders.filter(t => t.tender_id === selectedTender.tender_id)
    : []

  return (
    <>
      <div className="space-y-0">
        {uniqueTenders.length === 0 && (
          <p className="text-[12px] text-neutral-400 py-8 text-center">
            Noch keine Ausschreibungen.
          </p>
        )}
        {uniqueTenders.map((tender, i) => {
          const isNew = !!latestScanDate && tender.scan_date === latestScanDate
          const days = daysUntilDeadline(tender.deadline_date)

          return (
            <button
              key={tender.tender_id}
              onClick={() => setSelectedTender(tender)}
              className="w-full text-left py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors -mx-1 px-1 rounded"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-neutral-800 line-clamp-1 font-medium">
                    {tender.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {tender.company_name}
                    {days !== null && days >= 0 && (
                      <span className={days <= 7 ? ' text-red-500' : ''}>
                        {' '}· {days}d
                      </span>
                    )}
                  </p>
                </div>
                {isNew && (
                  <span className="text-[9px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                    Neu
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <TenderDrawer
        tender={selectedTender}
        allMatches={allMatches}
        open={!!selectedTender}
        onOpenChange={open => { if (!open) setSelectedTender(null) }}
      />
    </>
  )
}
