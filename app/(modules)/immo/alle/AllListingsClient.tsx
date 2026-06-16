'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { ListingDrawer } from '../_components/listings/ListingDrawer'
import { SearchBar } from '../_components/filters/SearchBar'
import { Button } from '@/components/ui/button'
import { DealBadge } from '../_components/listings/DealBadge'
import { Badge } from '@/components/ui/badge'
import {
  formatPrice,
  formatSize,
  formatRooms,
  formatPricePerSqm,
  formatFaktor,
  formatRendite,
  dealTier,
} from '@/lib/modules/immo/utils'
import type { DashboardRow } from '@/lib/modules/immo/types'

type SortField = 'faktor' | 'rendite' | 'created_at' | 'title' | 'city' | 'price' | 'size_sqm' | 'rooms' | 'price_per_sqm' | 'portal'
type SortDir = 'asc' | 'desc'

interface AllListingsClientProps {
  listings: DashboardRow[]
  total: number
  page: number
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

export function AllListingsClient({ listings, total, page }: AllListingsClientProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DashboardRow | null>(null)
  const [sortField, setSortField] = useState<SortField>('faktor')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize)

  const filtered = useMemo(() => {
    let result = listings
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((l: DashboardRow) =>
        l.title.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.property_type?.toLowerCase().includes(q) ||
        l.portal?.toLowerCase().includes(q) ||
        l.profile_name?.toLowerCase().includes(q)
      )
    }
    return sortListings(result, sortField, sortDir)
  }, [listings, search, sortField, sortDir])

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
      <div className="flex items-center justify-between gap-4 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Suchen..." />
        <p className="text-[11px] text-neutral-400 whitespace-nowrap tabular-nums">{total} Ergebnisse</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <SortHeader field="faktor">Faktor</SortHeader>
              <SortHeader field="rendite">Rendite</SortHeader>
              <SortHeader field="title">Objekt</SortHeader>
              <SortHeader field="city">Stadt</SortHeader>
              <SortHeader field="price">Kaufpreis</SortHeader>
              <SortHeader field="price_per_sqm">€/m²</SortHeader>
              <SortHeader field="size_sqm">Größe</SortHeader>
              <SortHeader field="rooms">Zimmer</SortHeader>
              <SortHeader field="portal">Portal</SortHeader>
              <th className="text-left text-[11px] text-neutral-400 font-medium px-3 py-2">Bewertung</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-[12px] text-neutral-400 py-12">
                  Keine Objekte gefunden.
                </td>
              </tr>
            )}
            {filtered.map((listing: DashboardRow, i: number) => {
              const tier = dealTier(listing.faktor)
              const isDealRow = tier !== 'neutral'
              return (
                <tr
                  key={`${listing.listing_id}-${i}`}
                  className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelected(listing)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-semibold tabular-nums ${isDealRow ? 'text-green-600' : 'text-neutral-700'}`}>
                        {formatFaktor(listing.faktor)}
                      </span>
                      {listing.is_estimated && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200">geschätzt</Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-[11px] text-neutral-500 px-3 py-2 tabular-nums">{formatRendite(listing.rendite)}</td>
                  <td className="text-[12px] max-w-xs px-3 py-2">
                    <span className="line-clamp-1 text-neutral-800">{listing.title}</span>
                  </td>
                  <td className="text-[11px] text-neutral-400 px-3 py-2">{listing.city ?? listing.location ?? '—'}</td>
                  <td className="text-[11px] text-neutral-500 px-3 py-2 tabular-nums">{formatPrice(listing.price)}</td>
                  <td className="text-[11px] text-neutral-400 px-3 py-2 tabular-nums">{formatPricePerSqm(listing.price_per_sqm)}</td>
                  <td className="text-[11px] text-neutral-400 px-3 py-2 tabular-nums">{formatSize(listing.size_sqm)}</td>
                  <td className="text-[11px] text-neutral-400 px-3 py-2 tabular-nums">{formatRooms(listing.rooms)}</td>
                  <td className="text-[11px] text-neutral-400 px-3 py-2">{listing.portal ?? '—'}</td>
                  <td className="px-3 py-2">
                    <DealBadge tier={tier} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {page > 1 && (
            <Link href={`/immo/alle?page=${page - 1}`}>
              <Button variant="outline" size="sm" className="text-[11px] text-neutral-500 border-neutral-200">Zurück</Button>
            </Link>
          )}
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/immo/alle?page=${page + 1}`}>
              <Button variant="outline" size="sm" className="text-[11px] text-neutral-500 border-neutral-200">Weiter</Button>
            </Link>
          )}
        </div>
      )}

      <ListingDrawer
        listing={selected}
        allMatches={allMatches}
        open={!!selected}
        onOpenChange={open => { if (!open) setSelected(null) }}
      />
    </>
  )
}
