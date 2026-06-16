'use client'

import Link from 'next/link'
import { formatFaktor, averageFaktor, bestFaktor, countDeals } from '@/lib/modules/immo/utils'
import type { SearchProfile, DashboardRow } from '@/lib/modules/immo/types'

interface ProfileCardProps {
  profile: SearchProfile
  listings: DashboardRow[]
}

export function ProfileCard({ profile, listings }: ProfileCardProps): React.JSX.Element {
  const activeListings = listings.filter(l => l.status === 'active')
  const deals = countDeals(activeListings)
  const avg = averageFaktor(activeListings)
  const best = bestFaktor(activeListings)

  return (
    <Link href={`/immo/suchprofile/${profile.slug}`}>
      <div className="bg-card rounded-xl border border-border p-4 hover:border-foreground/20 transition-colors cursor-pointer group">
        {/* Stadt + Farbe */}
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: profile.color }}
          />
          <span className="text-sm font-medium text-foreground truncate group-hover:text-foreground/70 transition-colors">
            {profile.city ?? profile.name}
          </span>
        </div>

        {/* Anzahl Deals */}
        <p className="text-[32px] font-semibold text-foreground leading-none tracking-tight tabular-nums">
          {deals}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Deals (Faktor ≤ 20)</p>

        {/* Faktor-Kennzahlen */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Bester{' '}
            <span className="text-foreground/70 tabular-nums">{formatFaktor(best)}</span>
          </span>
          <span className="text-muted-foreground">
            Ø{' '}
            <span className="text-foreground/70 tabular-nums">{formatFaktor(avg)}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
