'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UrgencyBadge } from './UrgencyBadge'
import { formatDeadline, daysUntilDeadline, getRelevanceBgClass, computeUrgency } from '@/lib/modules/vob/utils'
import { ExternalLink, Download, Trash2, Check } from 'lucide-react'
import { suggestCompany } from '@/lib/modules/vob/match-suggest'
import type { Company, DashboardRow } from '@/lib/modules/vob/types'

interface TenderDrawerProps {
  tender: DashboardRow | null
  allMatches?: DashboardRow[]
  companies?: Company[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
  onRequestedChange?: (id: string, current: boolean) => void
}

export function TenderDrawer({ tender, allMatches = [], companies = [], open, onOpenChange, onDelete, onRequestedChange }: TenderDrawerProps) {
  if (!tender) return null

  const urgency = tender.urgency || computeUrgency(tender.deadline_date)
  const days = daysUntilDeadline(tender.deadline_date)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-[14px] leading-snug pr-6 text-neutral-900 font-semibold">
            {tender.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5 px-4">
          <div className="flex items-center gap-2">
            <UrgencyBadge urgency={urgency} />
            {tender.category && (
              <Badge variant="outline" className="text-[10px] text-neutral-500 border-neutral-200">{tender.category}</Badge>
            )}
          </div>

          {onRequestedChange && (
            <button
              onClick={() => onRequestedChange(tender.tender_id, tender.requested)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-[12px] transition-colors ${
                tender.requested
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300'
              }`}
            >
              <span>{tender.requested ? 'Angefordert' : 'Nicht angefordert'}</span>
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                tender.requested
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-neutral-300 text-transparent'
              }`}>
                <Check size={12} strokeWidth={3} />
              </span>
            </button>
          )}

          <div className="space-y-3 text-[12px]">
            {tender.authority && (
              <div>
                <p className="text-[10px] text-neutral-400 mb-0.5">Auftraggeber</p>
                <p className="text-neutral-700">{tender.authority}</p>
              </div>
            )}
            {tender.deadline && (
              <div>
                <p className="text-[10px] text-neutral-400 mb-0.5">Abgabefrist</p>
                <p className="text-neutral-700">
                  {tender.deadline}
                  {days !== null && days >= 0 && (
                    <span className={days <= 7 ? ' text-red-500' : ' text-neutral-400'}>
                      {' '}({days}d)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <a href={tender.url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-[12px]">
              <ExternalLink size={13} className="mr-1.5" />
              Auf hamburg.de öffnen
            </Button>
          </a>

          <div className="h-px bg-neutral-100" />

          {allMatches.length > 0 && (
            <div>
              <p className="text-[10px] text-neutral-400 mb-2">Zugeordnete Unternehmen</p>
              <div className="space-y-2">
                {allMatches.map((match, i) => (
                  match.company_name && (
                    <div key={i} className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 border-l-[3px]" style={{ borderLeftColor: match.company_color ?? '#a3a3a3' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: match.company_color ?? '#a3a3a3' }} />
                        <span className="text-[12px] font-medium text-neutral-700">{match.company_name}</span>
                        {match.relevance && (
                          <Badge variant="outline" className={`ml-auto shrink-0 text-[10px] ${getRelevanceBgClass(match.relevance)}`}>
                            {match.relevance}
                          </Badge>
                        )}
                      </div>
                      {match.reason && (
                        <p className="text-[11px] text-neutral-500 pl-[18px] line-clamp-2">{match.reason}</p>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {allMatches.filter(m => m.company_name).length === 0 && companies.length > 0 && (() => {
            const suggestion = suggestCompany(tender.category, tender.title, companies)
            return suggestion ? (
              <div>
                <p className="text-[10px] text-neutral-400 mb-2">Vorgeschlagene Zuordnung</p>
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 border-l-[3px]" style={{ borderLeftColor: suggestion.company.color }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: suggestion.company.color }} />
                    <span className="text-[12px] font-medium text-neutral-700">{suggestion.company.name}</span>
                    <Badge variant="outline" className="ml-auto shrink-0 text-[10px] bg-amber-50 text-amber-600 border-amber-200">Vorschlag</Badge>
                  </div>
                  <p className="text-[11px] text-neutral-500 pl-[18px]">
                    Basierend auf Gewerk-Übereinstimmung mit {suggestion.company.trades.slice(0, 3).join(', ')}
                  </p>
                </div>
              </div>
            ) : null
          })()}

          {tender.reason && allMatches.length === 0 && (
            <div>
              <p className="text-[10px] text-neutral-400 mb-1">Match-Begründung</p>
              <p className="text-[12px] text-neutral-500">{tender.reason}</p>
            </div>
          )}

          <div className="h-px bg-neutral-100" />

          <Button
            variant="outline"
            className="w-full text-[12px] text-neutral-600 border-neutral-200"
            onClick={async () => {
              const { generateSingleTenderPdf } = await import('@/lib/pdf-generator')
              const doc = await generateSingleTenderPdf(tender, allMatches)
              const today = new Date().toISOString().slice(0, 10)
              doc.save(`VOB_Tender_${tender.tender_id}_${today}.pdf`)
            }}
          >
            <Download size={13} className="mr-1.5" />
            PDF exportieren
          </Button>

          {onDelete && (
            <Button
              variant="outline"
              className="w-full text-[12px] text-red-500 border-red-200 hover:bg-red-50"
              onClick={async () => {
                const res = await fetch('/api/tenders/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: [tender.tender_id] }),
                })
                if (res.ok) {
                  onDelete(tender.tender_id)
                  onOpenChange(false)
                }
              }}
            >
              <Trash2 size={13} className="mr-1.5" />
              Ausschreibung löschen
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
