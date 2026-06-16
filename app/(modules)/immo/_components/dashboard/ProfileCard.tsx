'use client'

import Link from 'next/link'
import { formatPricePerSqm, averagePricePerSqm } from '@/lib/modules/immo/utils'
import type { SearchProfile, DashboardRow } from '@/lib/modules/immo/types'

interface ProfileCardProps {
  profile: SearchProfile
  listings: DashboardRow[]
}

export function ProfileCard({ profile, listings }: ProfileCardProps): React.JSX.Element {
  const activeListings = listings.filter(l => l.status === 'active')
  const avg = averagePricePerSqm(activeListings)

  return (
    <Link href={`/immo/suchprofile/${profile.slug}`}>
      <div className="bg-card rounded-xl border border-border p-4 hover:border-foreground/20 transition-colors cursor-pointer group">
        {/* Name + Farbe */}
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: profile.color }}
          />
          <span className="text-sm font-medium text-foreground truncate group-hover:text-foreground/70 transition-colors">
            {profile.name}
          </span>
        </div>

        {/* Zähler */}
        <p className="text-[32px] font-semibold text-foreground leading-none tracking-tight tabular-nums">
          {activeListings.length}
        </p>
        <p className="text-xs text-muted-foreground mt-1">aktiv</p>

        {/* Durchschnittlicher Quadratmeterpreis */}
        <div className="mt-4 pt-3 border-t border-border">
          {avg !== null ? (
            <p className="text-xs text-muted-foreground">
              Ø Preis{' '}
              <span className="text-foreground/70">{formatPricePerSqm(avg)}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60">Keine Preisdaten</p>
          )}
        </div>
      </div>
    </Link>
  )
}
