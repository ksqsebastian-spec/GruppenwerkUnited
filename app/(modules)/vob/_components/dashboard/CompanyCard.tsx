'use client'

import Link from 'next/link'
import { daysUntilDeadline, formatDeadline } from '@/lib/modules/vob/utils'
import type { Company, DashboardRow, CompanyTrend } from '@/lib/modules/vob/types'

interface CompanyCardProps {
  company: Company
  tenders: DashboardRow[]
  trend?: CompanyTrend
}

export function CompanyCard({ company, tenders, trend }: CompanyCardProps) {
  const activeTenders = tenders.filter(t => t.status === 'active')

  const upcoming = activeTenders
    .filter(t => t.deadline_date)
    .sort((a, b) => (a.deadline_date! > b.deadline_date! ? 1 : -1))
  const nextDeadline = upcoming[0]
  const daysLeft = nextDeadline ? daysUntilDeadline(nextDeadline.deadline_date) : null

  return (
    <Link href={`/vob/unternehmen/${company.slug}`}>
      <div className="bg-white rounded-xl border border-neutral-200/60 p-4 hover:border-neutral-300 transition-colors cursor-pointer group">
        {/* Name + color */}
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: company.color }}
          />
          <span className="text-[13px] font-medium text-neutral-900 truncate group-hover:text-neutral-700 transition-colors">
            {company.name}
          </span>
        </div>

        {/* Count */}
        <p className="text-[32px] font-semibold text-neutral-900 leading-none tracking-tight tabular-nums">
          {activeTenders.length}
        </p>
        <p className="text-[11px] text-neutral-400 mt-1">aktiv</p>

        {/* Deadline — only if there is one */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          {nextDeadline && daysLeft !== null ? (
            <p className="text-[11px] text-neutral-400">
              Nächste Frist{' '}
              <span className={daysLeft <= 7 ? 'text-red-500' : 'text-neutral-600'}>
                {formatDeadline(nextDeadline.deadline_date)}
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-neutral-300">Keine Fristen</p>
          )}
        </div>
      </div>
    </Link>
  )
}
