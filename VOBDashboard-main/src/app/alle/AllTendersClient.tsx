'use client'

import { useState, useMemo, useOptimistic, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TenderDrawer } from '@/components/tenders/TenderDrawer'
import { SearchBar } from '@/components/filters/SearchBar'
import { Button } from '@/components/ui/button'
import { UrgencyBadge } from '@/components/tenders/UrgencyBadge'
import { NewBadge } from '@/components/tenders/NewBadge'
import { Badge } from '@/components/ui/badge'
import { formatDeadline, computeUrgency } from '@/lib/utils'
import { suggestCompany } from '@/lib/match-suggest'
import { Download, Trash2, AlertTriangle, Eye, EyeOff, Check } from 'lucide-react'
import type { Company, DashboardRow } from '@/lib/types'

type SortField = 'created_at' | 'deadline_date' | 'title' | 'authority' | 'category' | 'company_name'
type SortDir = 'asc' | 'desc'

interface AllTendersClientProps {
  tenders: DashboardRow[]
  total: number
  page: number
  companies: Company[]
}

function sortTenders(tenders: DashboardRow[], field: SortField, dir: SortDir): DashboardRow[] {
  return [...tenders].sort((a, b) => {
    const av = a[field] ?? ''
    const bv = b[field] ?? ''
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : 0
    return dir === 'asc' ? cmp : -cmp
  })
}

export function AllTendersClient({ tenders, total, page, companies }: AllTendersClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedTender, setSelectedTender] = useState<DashboardRow | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [wiping, setWiping] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewOnly, setViewOnly] = useState(false)
  const [requestedOverrides, setRequestedOverrides] = useState<Record<string, boolean>>({})

  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize)

  const tendersWithOverrides = useMemo(() =>
    tenders.map(t => ({
      ...t,
      requested: requestedOverrides[t.tender_id] ?? t.requested ?? false,
    })),
    [tenders, requestedOverrides]
  )

  const filtered = useMemo(() => {
    let result = tendersWithOverrides
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.authority?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.company_name?.toLowerCase().includes(q)
      )
    }
    return sortTenders(result, sortField, sortDir)
  }, [tendersWithOverrides, search, sortField, sortDir])

  const allMatches = selectedTender
    ? tendersWithOverrides.filter(t => t.tender_id === selectedTender.tender_id)
    : []

  const allFilteredIds = new Set(filtered.map(t => t.tender_id))
  const allSelected = filtered.length > 0 && filtered.every(t => selected.has(t.tender_id))

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        for (const id of allFilteredIds) next.delete(id)
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        for (const id of allFilteredIds) next.add(id)
        return next
      })
    }
  }

  async function toggleRequested(tenderId: string, current: boolean) {
    const next = !current
    setRequestedOverrides(prev => ({ ...prev, [tenderId]: next }))
    await fetch('/api/tenders/requested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenderId, requested: next }),
    })
  }

  async function handleDelete() {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      const res = await fetch('/api/tenders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (res.ok) {
        setSelected(new Set())
        router.refresh()
      }
    } finally {
      setDeleting(false)
    }
  }

  async function handleWipe() {
    setWiping(true)
    try {
      const res = await fetch('/api/tenders/wipe', { method: 'POST' })
      if (res.ok) {
        setSelected(new Set())
        setShowWipeConfirm(false)
        router.refresh()
      }
    } finally {
      setWiping(false)
    }
  }

  async function handleExportSelected() {
    if (selected.size === 0) return
    setExporting(true)
    try {
      const selectedTenders = tenders.filter(t => selected.has(t.tender_id))
      const { generateCompanyPdf } = await import('@/lib/pdf-generator')
      const doc = await generateCompanyPdf('Ausgewählte Ausschreibungen', selectedTenders)
      const today = new Date().toISOString().slice(0, 10)
      doc.save(`VOB_Auswahl_${today}.pdf`)
    } finally {
      setExporting(false)
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
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Suchen..." />
          <Button
            variant="outline"
            size="sm"
            className={`text-[11px] border-neutral-200 ${viewOnly ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400'}`}
            onClick={() => { setViewOnly(v => !v); setSelected(new Set()) }}
          >
            {viewOnly ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
            {viewOnly ? 'Ansicht' : 'Bearbeiten'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {!viewOnly && selected.size > 0 && (
            <>
              <span className="text-[11px] text-neutral-500 tabular-nums">{selected.size} ausgewählt</span>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] text-neutral-500 border-neutral-200"
                onClick={handleExportSelected}
                disabled={exporting}
              >
                <Download size={12} className="mr-1" />
                {exporting ? '...' : 'PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={12} className="mr-1" />
                {deleting ? '...' : 'Löschen'}
              </Button>
            </>
          )}
          {!viewOnly && (
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] text-red-400 border-red-200 hover:bg-red-50"
              onClick={() => setShowWipeConfirm(true)}
            >
              <AlertTriangle size={12} className="mr-1" />
              Alle löschen
            </Button>
          )}
          <p className="text-[11px] text-neutral-400 whitespace-nowrap tabular-nums">{total} Ergebnisse</p>
        </div>
      </div>

      {/* Wipe confirmation */}
      {showWipeConfirm && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-[12px] text-red-700">
              Alle Ausschreibungen, Matches und Scans werden unwiderruflich gelöscht.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] border-neutral-200"
              onClick={() => setShowWipeConfirm(false)}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="text-[11px] bg-red-600 hover:bg-red-700 text-white"
              onClick={handleWipe}
              disabled={wiping}
            >
              {wiping ? 'Lösche...' : 'Ja, alles löschen'}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-neutral-200/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              {!viewOnly && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-neutral-300 accent-neutral-900 w-3.5 h-3.5"
                  />
                </th>
              )}
              <SortHeader field="title">Titel</SortHeader>
              <SortHeader field="authority">Auftraggeber</SortHeader>
              <SortHeader field="deadline_date">Frist</SortHeader>
              <SortHeader field="category">Gewerk</SortHeader>
              <SortHeader field="company_name">Unternehmen</SortHeader>
              <th className="text-left text-[11px] text-neutral-400 font-medium px-3 py-2">Status</th>
              <th className="text-center text-[11px] text-neutral-400 font-medium px-3 py-2 w-[90px]">Angefordert</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={viewOnly ? 7 : 8} className="text-center text-[12px] text-neutral-400 py-12">
                  Keine Ausschreibungen gefunden.
                </td>
              </tr>
            )}
            {filtered.map((tender, i) => {
              const urgency = tender.urgency || computeUrgency(tender.deadline_date)
              const suggestion = !tender.company_name && companies.length > 0
                ? suggestCompany(tender.category, tender.title, companies)
                : null

              return (
                <tr
                  key={`${tender.tender_id}-${i}`}
                  className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                >
                  {!viewOnly && (
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(tender.tender_id)}
                        onChange={() => toggleSelect(tender.tender_id)}
                        className="rounded border-neutral-300 accent-neutral-900 w-3.5 h-3.5"
                      />
                    </td>
                  )}
                  <td
                    className="text-[12px] max-w-xs px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedTender(tender)}
                  >
                    <span className="line-clamp-1 text-neutral-800">{tender.title}</span>
                  </td>
                  <td
                    className="text-[11px] text-neutral-400 px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedTender(tender)}
                  >
                    {tender.authority ?? '—'}
                  </td>
                  <td
                    className="text-[11px] text-neutral-500 px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedTender(tender)}
                  >
                    {formatDeadline(tender.deadline_date)}
                  </td>
                  <td
                    className="text-[11px] text-neutral-400 px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedTender(tender)}
                  >
                    {tender.category ?? '—'}
                  </td>
                  <td
                    className="text-[11px] px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedTender(tender)}
                  >
                    {tender.company_name ? (
                      <span className="flex items-center gap-1.5 text-neutral-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tender.company_color ?? '#a3a3a3' }} />
                        {tender.company_name}
                      </span>
                    ) : suggestion ? (
                      <span className="flex items-center gap-1.5 text-neutral-400 italic">
                        <span className="w-1.5 h-1.5 rounded-full border border-current shrink-0" style={{ borderColor: suggestion.company.color }} />
                        <span className="truncate">{suggestion.company.name}</span>
                        <Badge variant="outline" className="shrink-0 text-[9px] bg-amber-50 text-amber-600 border-amber-200">Vorschlag</Badge>
                      </span>
                    ) : '—'}
                  </td>
                  <td
                    className="px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedTender(tender)}
                  >
                    <UrgencyBadge urgency={urgency} />
                  </td>
                  <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleRequested(tender.tender_id, tender.requested)}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                        tender.requested
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-neutral-300 hover:border-neutral-400 text-transparent'
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
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
            <Link href={`/alle?page=${page - 1}`}>
              <Button variant="outline" size="sm" className="text-[11px] text-neutral-500 border-neutral-200">Zurück</Button>
            </Link>
          )}
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/alle?page=${page + 1}`}>
              <Button variant="outline" size="sm" className="text-[11px] text-neutral-500 border-neutral-200">Weiter</Button>
            </Link>
          )}
        </div>
      )}

      <TenderDrawer
        tender={selectedTender}
        allMatches={allMatches}
        companies={companies}
        open={!!selectedTender}
        onOpenChange={open => { if (!open) setSelectedTender(null) }}
        onDelete={viewOnly ? undefined : () => router.refresh()}
        onRequestedChange={toggleRequested}
      />
    </>
  )
}
