'use client'

import { useState } from 'react'
import { ListingDrawer } from './_components/listings/ListingDrawer'
import { formatPrice, formatFaktor, formatRendite, dealTier } from '@/lib/modules/immo/utils'
import type { DashboardRow } from '@/lib/modules/immo/types'

interface RecentFeedProps {
  listings: DashboardRow[]
}

export function RecentFeed({ listings }: RecentFeedProps) {
  const [selected, setSelected] = useState<DashboardRow | null>(null)

  const seen = new Set<string>()
  const uniqueListings = listings.filter(l => {
    if (seen.has(l.listing_id)) return false
    seen.add(l.listing_id)
    return true
  }).slice(0, 8)

  const allMatches = selected
    ? listings.filter(l => l.listing_id === selected.listing_id)
    : []

  return (
    <>
      <div className="space-y-0">
        {uniqueListings.length === 0 && (
          <p className="text-[12px] text-neutral-400 py-8 text-center">
            Noch keine Objekte.
          </p>
        )}
        {uniqueListings.map((listing) => {
          const tier = dealTier(listing.faktor)
          const isDealRow = tier !== 'neutral'
          return (
            <button
              key={listing.listing_id}
              onClick={() => setSelected(listing)}
              className="w-full text-left py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors -mx-1 px-1 rounded"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-neutral-800 line-clamp-1 font-medium">
                    {listing.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {listing.city ?? listing.profile_name}
                    {listing.price !== null && (
                      <span> · {formatPrice(listing.price)}</span>
                    )}
                    {listing.rendite !== null && (
                      <span> · {formatRendite(listing.rendite)}</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className={`text-[14px] font-semibold tabular-nums leading-none ${isDealRow ? 'text-green-600' : 'text-neutral-700'}`}>
                    {formatFaktor(listing.faktor)}
                  </span>
                  <span className="text-[9px] text-neutral-400">Faktor</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <ListingDrawer
        listing={selected}
        allMatches={allMatches}
        open={!!selected}
        onOpenChange={open => { if (!open) setSelected(null) }}
      />
    </>
  )
}
