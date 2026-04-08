'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Clock } from 'lucide-react'
import type { Company } from '@/lib/types'

interface SidebarProps {
  companies: Company[]
  matchCounts?: Record<string, number>
}

export function Sidebar({ companies, matchCounts = {} }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/alle', label: 'Alle Ausschreibungen', icon: FileText },
  ]

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[240px] lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200/60 z-40">
      {/* Brand */}
      <div className="flex items-center h-14 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center">
            <span className="text-white font-semibold text-[10px] tracking-wide">GW</span>
          </div>
          <span className="font-semibold text-neutral-900 text-[14px]">VOB Monitor</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <div className="space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] rounded-lg transition-colors',
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                )}
              >
                <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="mt-6 mb-2 px-2.5">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            Unternehmen
          </p>
        </div>

        <div className="space-y-0.5">
          {companies.map(company => {
            const href = `/unternehmen/${company.slug}`
            const isActive = pathname === href
            const count = matchCounts[company.slug] || 0
            return (
              <Link
                key={company.slug}
                href={href}
                className={cn(
                  'flex items-center justify-between px-2.5 py-[7px] text-[13px] rounded-lg transition-colors',
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                )}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: company.color }}
                  />
                  <span className="truncate">{company.name}</span>
                </span>
                {count > 0 && (
                  <span className="text-[11px] text-neutral-400 tabular-nums">{count}</span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100">
          <Link
            href="/verlauf"
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] rounded-lg transition-colors',
              pathname === '/verlauf'
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
            )}
          >
            <Clock size={15} strokeWidth={pathname === '/verlauf' ? 2 : 1.5} />
            Verlauf
          </Link>
        </div>
      </nav>
    </aside>
  )
}
