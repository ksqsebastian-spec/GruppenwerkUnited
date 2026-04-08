'use client'

import { Badge } from '@/components/ui/badge'
import { UrgencyBadge } from './UrgencyBadge'
import { NewBadge } from './NewBadge'
import { formatDeadline, daysUntilDeadline, getRelevanceBgClass, computeUrgency } from '@/lib/modules/vob/utils'
import type { DashboardRow } from '@/lib/modules/vob/types'

interface TenderCardProps {
  tender: DashboardRow
  isNew?: boolean
  onClick?: () => void
}

export function TenderCard({ tender, isNew, onClick }: TenderCardProps) {
  const urgency = tender.urgency || computeUrgency(tender.deadline_date)
  const days = daysUntilDeadline(tender.deadline_date)

  return (
    <div
      className="bg-white rounded-xl border border-neutral-200/60 p-4 hover:border-neutral-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[13px] font-medium text-neutral-900 line-clamp-2">{tender.title}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isNew && <NewBadge />}
          <UrgencyBadge urgency={urgency} />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-neutral-400">
        {tender.authority && <span>{tender.authority}</span>}
        {tender.deadline_date && (
          <span className={days !== null && days <= 7 ? 'text-red-500' : ''}>
            {formatDeadline(tender.deadline_date)}
            {days !== null && days >= 0 && ` (${days}d)`}
          </span>
        )}
        {tender.company_name && (
          <span className="flex items-center gap-1.5">
            {tender.company_color && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tender.company_color }} />
            )}
            {tender.company_name}
          </span>
        )}
      </div>
    </div>
  )
}
