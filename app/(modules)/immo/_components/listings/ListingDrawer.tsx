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
  getRelevanceBgClass,
  isGoodDeal,
} from '@/lib/modules/immo/utils'
import { ExternalLink } from 'lucide-react'
import type { DashboardRow } from '@/lib/modules/immo/types'

interface ListingDrawerProps {
  listing: DashboardRow | null
  allMatches?: DashboardRow[]
  referencePricePerSqm?: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ListingDrawer({ listing, allMatches = [], referencePricePerSqm = null, open, onOpenChange }: ListingDrawerProps): React.JSX.Element | null {
  if (!listing) return null

  const goodDeal = isGoodDeal(listing.price_per_sqm, referencePricePerSqm)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="text-left text-sm leading-snug pr-6 text-foreground font-semibold">
            {listing.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5 px-4">
          <div className="flex flex-wrap items-center gap-2">
            {referencePricePerSqm !== null && <DealBadge good={goodDeal} />}
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
              <p className="text-[10px] text-muted-foreground mb-0.5">Preis</p>
              <p className="text-foreground font-medium">{formatPrice(listing.price)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">€/m²</p>
              <p className={`font-medium ${goodDeal ? 'text-green-600' : 'text-foreground'}`}>
                {formatPricePerSqm(listing.price_per_sqm)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Fläche</p>
              <p className="text-foreground">{formatSize(listing.size_sqm)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Zimmer</p>
              <p className="text-foreground">{formatRooms(listing.rooms)}</p>
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
              Inserat öffnen
            </Button>
          </a>

          <div className="h-px bg-border" />

          {allMatches.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">Zugeordnete Suchprofile</p>
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
