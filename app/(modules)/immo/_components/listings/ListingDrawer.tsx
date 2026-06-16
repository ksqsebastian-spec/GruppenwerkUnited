'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DealBadge } from './DealBadge'
import {
  formatPrice,
  formatSize,
  formatRooms,
  formatPricePerSqm,
  formatFaktor,
  formatRendite,
  getRelevanceBgClass,
  dealTier,
} from '@/lib/modules/immo/utils'
import { ExternalLink } from 'lucide-react'
import type { DashboardRow } from '@/lib/modules/immo/types'

interface ListingDrawerProps {
  listing: DashboardRow | null
  allMatches?: DashboardRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ListingDrawer({ listing, allMatches = [], open, onOpenChange }: ListingDrawerProps): React.JSX.Element | null {
  if (!listing) return null

  const tier = dealTier(listing.faktor)
  const isDealRow = tier !== 'neutral'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="text-left text-sm leading-snug pr-6 text-foreground font-semibold">
            {listing.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5 px-4">
          {/* Faktor – prominente Kennzahl */}
          <div className={`rounded-xl border p-4 ${isDealRow ? 'bg-green-50 border-green-200' : 'bg-muted border-border'}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Kaufpreisfaktor</p>
              <div className="flex items-center gap-1.5">
                {listing.is_estimated && (
                  <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">geschätzt</Badge>
                )}
                <DealBadge tier={tier} />
              </div>
            </div>
            <p className={`text-[34px] font-semibold leading-none tabular-nums ${isDealRow ? 'text-green-700' : 'text-foreground'}`}>
              {formatFaktor(listing.faktor)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Rendite <span className="text-foreground/70 font-medium">{formatRendite(listing.rendite)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listing.property_type && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{listing.property_type}</Badge>
            )}
            {listing.transaction_type && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{listing.transaction_type}</Badge>
            )}
            {listing.portal && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{listing.portal}</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Kaufpreis</p>
              <p className="text-foreground font-medium">{formatPrice(listing.price)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Jahresnettokaltmiete</p>
              <p className="text-foreground font-medium">{formatPrice(listing.jahresnettokaltmiete)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">€/m²</p>
              <p className="text-foreground">{formatPricePerSqm(listing.price_per_sqm)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Größe</p>
              <p className="text-foreground">{formatSize(listing.size_sqm)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Zimmer</p>
              <p className="text-foreground">{formatRooms(listing.rooms)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Stadt</p>
              <p className="text-foreground">{listing.city ?? '—'}</p>
            </div>
            {listing.location && (
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Lage</p>
                <p className="text-foreground">{listing.location}</p>
              </div>
            )}
          </div>

          <a href={listing.url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-foreground hover:bg-foreground/90 text-background text-xs">
              <ExternalLink size={13} className="mr-1.5" />
              Objekt öffnen
            </Button>
          </a>

          <div className="h-px bg-border" />

          {allMatches.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">Zugeordnete Städte</p>
              <div className="space-y-2">
                {allMatches.map((match, i) => (
                  match.profile_name && (
                    <div key={i} className="p-3 rounded-lg bg-muted border border-border border-l-[3px]" style={{ borderLeftColor: match.profile_color ?? '#a3a3a3' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: match.profile_color ?? '#a3a3a3' }} />
                        <span className="text-xs font-medium text-foreground">{match.profile_name}</span>
                        {match.relevance && (
                          <Badge variant="outline" className={`ml-auto shrink-0 text-[10px] ${getRelevanceBgClass(match.relevance)}`}>
                            {match.relevance}
                          </Badge>
                        )}
                      </div>
                      {match.reason && (
                        <p className="text-[11px] text-muted-foreground pl-[18px] line-clamp-2">{match.reason}</p>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {listing.reason && allMatches.length === 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Treffer-Begründung</p>
              <p className="text-xs text-muted-foreground">{listing.reason}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
