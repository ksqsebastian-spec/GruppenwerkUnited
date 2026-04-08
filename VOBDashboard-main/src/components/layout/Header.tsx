'use client'

import { formatDate } from '@/lib/utils'
import type { VobScan } from '@/lib/types'

interface HeaderProps {
  latestScan?: VobScan | null
}

export function Header({ latestScan }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-12 flex items-center px-6 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
      <div className="flex items-center justify-between w-full">
        <span className="text-[13px] font-medium text-neutral-900 lg:hidden">VOB Monitor</span>
        <div className="ml-auto text-[12px] text-neutral-400">
          {latestScan ? (
            <span>
              Letzter Scan: <span className="text-neutral-600">KW {latestScan.calendar_week}</span>
              <span className="mx-1.5 text-neutral-300">·</span>
              {formatDate(latestScan.scan_date)}
            </span>
          ) : (
            <span>Kein Scan vorhanden</span>
          )}
        </div>
      </div>
    </header>
  )
}
