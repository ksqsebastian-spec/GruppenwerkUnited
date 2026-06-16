import { parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { DashboardRow } from './types'

export { cn }

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), 'dd.MM.yyyy', { locale: de })
  } catch {
    return dateString
  }
}

export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatSize(size: number | null): string {
  if (size === null || size === undefined) return '—'
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(size)} m²`
}

export function formatRooms(rooms: number | null): string {
  if (rooms === null || rooms === undefined) return '—'
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(rooms)} Zi.`
}

export function formatPricePerSqm(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value)} €/m²`
}

/**
 * Durchschnittlicher Quadratmeterpreis einer Inserat-Liste.
 */
export function averagePricePerSqm(listings: DashboardRow[]): number | null {
  const values = listings
    .map((l) => l.price_per_sqm)
    .filter((v): v is number => v !== null && v !== undefined && v > 0)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Markiert ein Inserat als gutes Angebot, wenn der Quadratmeterpreis
 * spürbar unter dem Vergleichswert (z.B. Durchschnitt) liegt.
 */
export function isGoodDeal(pricePerSqm: number | null, reference: number | null): boolean {
  if (pricePerSqm === null || pricePerSqm === undefined || pricePerSqm <= 0) return false
  if (reference === null || reference === undefined || reference <= 0) return false
  return pricePerSqm <= reference * 0.9
}

export function getPortalLabel(portal: string | null): string {
  if (!portal) return '—'
  return portal
}

export function getRelevanceBgClass(relevance: string | null): string {
  switch (relevance) {
    case 'sehr hoch': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'hoch': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'mittel': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-gray-100 text-gray-500 border-gray-200'
  }
}

export function getDealBgClass(good: boolean): string {
  return good
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'
}
