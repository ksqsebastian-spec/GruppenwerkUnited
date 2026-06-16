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
 * Formatiert den Kaufpreisfaktor, z.B. "17,2".
 */
export function formatFaktor(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value)
}

/**
 * Formatiert die Bruttorendite in Prozent, z.B. "5,8 %".
 */
export function formatRendite(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value)} %`
}

/** Schwelle, ab der ein Objekt als "Deal" gilt. */
export const DEAL_FACTOR_THRESHOLD = 20
/** Faktor für die stärkste Deal-Stufe. */
export const STRONG_DEAL_FACTOR_THRESHOLD = 16

export type DealTier = 'strong' | 'deal' | 'neutral'

/**
 * Durchschnittlicher Kaufpreisfaktor einer Objekt-Liste.
 */
export function averageFaktor(listings: DashboardRow[]): number | null {
  const values = listings
    .map((l) => l.faktor)
    .filter((v): v is number => v !== null && v !== undefined && v > 0)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Durchschnittliche Bruttorendite einer Objekt-Liste.
 */
export function averageRendite(listings: DashboardRow[]): number | null {
  const values = listings
    .map((l) => l.rendite)
    .filter((v): v is number => v !== null && v !== undefined && v > 0)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Bester (niedrigster) Kaufpreisfaktor einer Objekt-Liste.
 */
export function bestFaktor(listings: DashboardRow[]): number | null {
  const values = listings
    .map((l) => l.faktor)
    .filter((v): v is number => v !== null && v !== undefined && v > 0)
  if (values.length === 0) return null
  return Math.min(...values)
}

/**
 * Markiert ein Objekt als Deal, wenn der Kaufpreisfaktor <= Schwelle liegt.
 */
export function isDeal(faktor: number | null): boolean {
  if (faktor === null || faktor === undefined || faktor <= 0) return false
  return faktor <= DEAL_FACTOR_THRESHOLD
}

/**
 * Stuft ein Objekt anhand des Kaufpreisfaktors ein.
 */
export function dealTier(faktor: number | null): DealTier {
  if (faktor === null || faktor === undefined || faktor <= 0) return 'neutral'
  if (faktor <= STRONG_DEAL_FACTOR_THRESHOLD) return 'strong'
  if (faktor <= DEAL_FACTOR_THRESHOLD) return 'deal'
  return 'neutral'
}

/**
 * Zählt die Deals (Faktor <= Schwelle) in einer Objekt-Liste.
 */
export function countDeals(listings: DashboardRow[]): number {
  return listings.filter((l) => isDeal(l.faktor)).length
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

export function getDealBgClass(tier: DealTier): string {
  switch (tier) {
    case 'strong': return 'bg-green-100 text-green-800 border-green-200'
    case 'deal': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}
