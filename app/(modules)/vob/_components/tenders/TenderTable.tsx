'use client'

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UrgencyBadge } from './UrgencyBadge'
import { NewBadge } from './NewBadge'
import { formatDeadline, computeUrgency } from '@/lib/modules/vob/utils'
import { suggestCompany } from '@/lib/modules/vob/match-suggest'
import type { Company, DashboardRow } from '@/lib/modules/vob/types'

interface TenderTableProps {
  tenders: DashboardRow[]
  latestScanDate?: string | null
  companies?: Company[]
  onRowClick?: (tender: DashboardRow) => void
}

export function TenderTable({ tenders, latestScanDate, companies = [], onRowClick }: TenderTableProps) {
  const suggestions = useMemo(() => {
    if (companies.length === 0) return new Map<string, ReturnType<typeof suggestCompany>>()
    const map = new Map<string, ReturnType<typeof suggestCompany>>()
    for (const t of tenders) {
      if (!t.company_name) {
        map.set(t.tender_id, suggestCompany(t.category, t.title, companies))
      }
    }
    return map
  }, [tenders, companies])

  return (
    <div className="bg-white border border-neutral-200/60 rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            <TableHead className="text-[11px] text-neutral-400 font-medium">Titel</TableHead>
            <TableHead className="text-[11px] text-neutral-400 font-medium">Auftraggeber</TableHead>
            <TableHead className="text-[11px] text-neutral-400 font-medium">Frist</TableHead>
            <TableHead className="text-[11px] text-neutral-400 font-medium">Gewerk</TableHead>
            <TableHead className="text-[11px] text-neutral-400 font-medium">Unternehmen</TableHead>
            <TableHead className="text-[11px] text-neutral-400 font-medium">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-[12px] text-neutral-400 py-12">
                Keine Ausschreibungen gefunden.
              </TableCell>
            </TableRow>
          )}
          {tenders.map((tender, i) => {
            const urgency = tender.urgency || computeUrgency(tender.deadline_date)
            const isNew = latestScanDate && tender.scan_date === latestScanDate

            return (
              <TableRow
                key={`${tender.tender_id}-${i}`}
                className="cursor-pointer border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                onClick={() => onRowClick?.(tender)}
              >
                <TableCell className="text-[12px] max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 text-neutral-800">{tender.title}</span>
                    {isNew && <NewBadge />}
                  </div>
                </TableCell>
                <TableCell className="text-[11px] text-neutral-400">{tender.authority ?? '—'}</TableCell>
                <TableCell className="text-[11px] text-neutral-500">{formatDeadline(tender.deadline_date)}</TableCell>
                <TableCell className="text-[11px] text-neutral-400">{tender.category ?? '—'}</TableCell>
                <TableCell className="text-[11px]">
                  {tender.company_name ? (
                    <span className="flex items-center gap-1.5 text-neutral-500">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tender.company_color ?? '#a3a3a3' }} />
                      {tender.company_name}
                    </span>
                  ) : (() => {
                    const suggestion = suggestions.get(tender.tender_id)
                    return suggestion ? (
                      <span className="flex items-center gap-1.5 text-neutral-400 italic">
                        <span className="w-1.5 h-1.5 rounded-full border border-current shrink-0" style={{ borderColor: suggestion.company.color }} />
                        <span className="truncate">{suggestion.company.name}</span>
                        <Badge variant="outline" className="shrink-0 text-[9px] bg-amber-50 text-amber-600 border-amber-200">Vorschlag</Badge>
                      </span>
                    ) : '—'
                  })()}
                </TableCell>
                <TableCell>
                  <UrgencyBadge urgency={urgency} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
