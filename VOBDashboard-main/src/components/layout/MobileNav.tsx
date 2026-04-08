'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LayoutDashboard, FileText, Clock, Menu } from 'lucide-react'
import type { Company } from '@/lib/types'
import { useState } from 'react'

interface MobileNavProps {
  companies: Company[]
  matchCounts?: Record<string, number>
}

export function MobileNav({ companies, matchCounts = {} }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="fixed bottom-4 right-4 z-50 rounded-full w-11 h-11 bg-neutral-900 text-white shadow-lg flex items-center justify-center">
          <Menu size={18} />
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0 bg-white">
          <div className="flex items-center h-14 px-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center">
                <span className="text-white font-semibold text-[10px]">GW</span>
              </div>
              <span className="font-semibold text-neutral-900 text-[14px]">VOB Monitor</span>
            </div>
          </div>
          <nav className="px-3 pt-2 pb-4">
            {[
              { href: '/', label: 'Dashboard', icon: LayoutDashboard },
              { href: '/alle', label: 'Alle Ausschreibungen', icon: FileText },
            ].map(item => {
              const Icon = item.icon
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] rounded-lg transition-colors',
                    isActive ? 'bg-neutral-100 text-neutral-900 font-medium' : 'text-neutral-500'
                  )}
                >
                  <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                  {item.label}
                </Link>
              )
            })}

            <div className="mt-6 mb-2 px-2.5">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Unternehmen</p>
            </div>
            {companies.map(company => {
              const href = `/unternehmen/${company.slug}`
              const count = matchCounts[company.slug] || 0
              return (
                <Link
                  key={company.slug}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-[7px] text-[13px] rounded-lg transition-colors',
                    pathname === href ? 'bg-neutral-100 text-neutral-900 font-medium' : 'text-neutral-500'
                  )}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: company.color }} />
                    <span className="truncate">{company.name}</span>
                  </span>
                  {count > 0 && <span className="text-[11px] text-neutral-400 tabular-nums">{count}</span>}
                </Link>
              )
            })}

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <Link
                href="/verlauf"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] rounded-lg transition-colors',
                  pathname === '/verlauf' ? 'bg-neutral-100 text-neutral-900 font-medium' : 'text-neutral-500'
                )}
              >
                <Clock size={15} strokeWidth={pathname === '/verlauf' ? 2 : 1.5} />
                Verlauf
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
