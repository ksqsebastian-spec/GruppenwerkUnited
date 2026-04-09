'use client'

import Link from 'next/link'
import { daysUntilDeadline, formatDeadline } from '@/lib/modules/vob/utils'
import type { Company, DashboardRow, CompanyTrend } from '@/lib/modules/vob/types'

interface CompanyCardProps {
  company: Company
  tenders: DashboardRow[]
  trend?: CompanyTrend
}

export function CompanyCard({ company, tenders, trend }: CompanyCardProps): React.JSX.Element {
  const activeTenders = tenders.filter(t => t.status === 'active')

  const upcoming = activeTenders
    .filter(t => t.deadline_date)
    .sort((a, b) => (a.deadline_date! > b.deadline_date! ? 1 : -1))
  const nextDeadline = upcoming[0]
  const daysLeft = nextDeadline ? daysUntilDeadline(nextDeadline.deadline_date) : null

  return (
    <Link href={`/vob/unternehmen/${company.slug}`}>
      <div className="bg-card rounded-xl border border-border p-4 hover:border-foreground/20 transition-colors cursor-pointer group">
        {/* Name + Farbe */}
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: company.color }}
          />
          <span className="text-sm font-medium text-foreground truncate group-hover:text-foreground/70 transition-colors">
            {company.name}
          </span>
        </div>

        {/* Zähler */}
        <p className="text-[32px] font-semibold text-foreground leading-none tracking-tight tabular-nums">
          {activeTenders.length}
        </p>
        <p className="text-xs text-muted-foreground mt-1">aktiv</p>

        {/* Frist */}
        <div className="mt-4 pt-3 border-t border-border">
          {nextDeadline && daysLeft !== null ? (
            <p className="text-xs text-muted-foreground">
              Nächste Frist{' '}
              <span className={daysLeft <= 7 ? 'text-red-500' : 'text-foreground/70'}>
                {formatDeadline(nextDeadline.deadline_date)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60">Keine Fristen</p>
          )}
        </div>
      </div>
    </Link>
  )
}
