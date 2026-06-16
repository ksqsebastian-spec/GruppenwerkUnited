'use client'

import React, { useState, useMemo } from 'react'
import { ListingDrawer } from '../../_components/listings/ListingDrawer'
import { SearchBar } from '../../_components/filters/SearchBar'
import { StatusFilter } from '../../_components/filters/StatusFilter'
import { DealBadge } from '../../_components/listings/DealBadge'
import {
  formatPrice,
  formatSize,
  formatRooms,
  formatPricePerSqm,
  averagePricePerSqm,
  isGoodDeal,
} from '@/lib/modules/immo/utils'
import type { DashboardRow } from '@/lib/modules/immo/types'

type SortField = 'created_at' | 'title' | 'location' | 'price' | 'size_sqm' | 'rooms' | 'price_per_sqm'
type SortDir = 'asc' | 'desc'

interface ProfileListingListProps {
  listings: DashboardRow[]
}

function sortListings(listings: DashboardRow[], field: SortField, dir: SortDir): DashboardRow[] {
  return [...listings].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    let cmp = 0
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else if (typeof av === 'number') {
      cmp = -1
    } else if (typeof bv === 'number') {
      cmp = 1
    } else {
      cmp = String(av ?? '').localeCompare(String(bv ?? ''))
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

export function ProfileListingList({ listings }: ProfileListingListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<DashboardRow | null>(null)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const reference = useMemo(() => averagePricePerSqm(listings), [listings])

  const filtered = useMemo(() => {
    let result = listings
    if (status === 'active') result = result.filter((l: DashboardRow) => l.status === 'active')
    if (status === 'inactive') result = result.filter((l: DashboardRow) => l.status === 'inactive')
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l: DashboardRow) =>
          l.title.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.property_type?.toLowerCase().includes(q) ||
          l.portal?.toLowerCase().includes(q)
      )
    }
    return sortListings(result, sortField, sortDir)
  }, [listings, status, search, sortField, sortDir])

  const allMatches = selected
    ? listings.filter((l: DashboardRow) => l.listing_id === selected.listing_id)
    : []

  function toggleSort(field: SortField): void {
    if (sortField === field) {
      setSortDir((d: SortDir) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="text-left text-[11px] text-neutral-400 font-medium px-3 py-2 cursor-pointer select-none hover:text-neutral-600 transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-[9px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
        )}
      </span>
    </th>
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <StatusFilter value={status} onChange={setStatus} />
          <SearchBar value={search} onChange={setSearch} placeholder="Suchen..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12px] text-neutral-400 py-12 text-center">
          Keine passenden Inserate.
        </p>
      ) : (
        <div className="bg-white border border-neutral-200/60 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <SortHeader field="title">Titel</SortHeader>
                <SortHeader field="location">Lage</SortHeader>
                <SortHeader field="price">Preis</SortHeader>
                <SortHeader field="size_sqm">Fläche</SortHeader>
                <SortHeader field="rooms">Zimmer</SortHeader>
                <SortHeader field="price_per_sqm">€/m²</SortHeader>
                <th className="text-left text-[11px] text-neutral-400 font-medium px-3 py-2">Bewertung</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing: DashboardRow, i: number) => {
                const goodDeal = isGoodDeal(listing.price_per_sqm, reference)
                return (
                  <tr
                    key={`${listing.listing_id}-${i}`}
                    className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(listing)}
                  >
                    <td className="text-[12px] max-w-xs px-3 py-2">
                      <span className="line-clamp-1 text-neutral-800">{listing.title}</span>
                    </td>
                    <td className="text-[11px] text-neutral-400 px-3 py-2">{listing.location ?? '—'}</td>
                    <td className="text-[11px] text-neutral-500 px-3 py-2 tabular-nums">{formatPrice(listing.price)}</td>
                    <td className="text-[11px] text-neutral-400 px-3 py-2 tabular-nums">{formatSize(listing.size_sqm)}</td>
                    <td className="text-[11px] text-neutral-400 px-3 py-2 tabular-nums">{formatRooms(listing.rooms)}</td>
                    <td className={`text-[11px] px-3 py-2 tabular-nums ${goodDeal ? 'text-green-600 font-medium' : 'text-neutral-500'}`}>
                      {formatPricePerSqm(listing.price_per_sqm)}
                    </td>
                    <td className="px-3 py-2">
                      <DealBadge good={goodDeal} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ListingDrawer
        listing={selected}
        allMatches={allMatches}
        referencePricePerSqm={reference}
        open={!!selected}
        onOpenChange={open => { if (!open) setSelected(null) }}
      />
    </>
  )
}
