import { differenceInDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Urgency } from './types'

export { cn }

export function computeUrgency(deadlineDate: string | null): Urgency {
  if (!deadlineDate) return 'unknown'
  const deadline = parseISO(deadlineDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = differenceInDays(deadline, today)
  if (days < 0) return 'expired'
  if (days <= 7) return 'urgent'
  if (days <= 14) return 'soon'
  return 'normal'
}

export function daysUntilDeadline(deadlineDate: string | null): number | null {
  if (!deadlineDate) return null
  const deadline = parseISO(deadlineDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInDays(deadline, today)
}

export function formatDeadline(deadlineDate: string | null): string {
  if (!deadlineDate) return 'Keine Frist'
  try {
    return format(parseISO(deadlineDate), 'dd.MM.yyyy', { locale: de })
  } catch {
    return deadlineDate
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), 'dd.MM.yyyy', { locale: de })
  } catch {
    return dateString
  }
}

export function getUrgencyColor(urgency: Urgency): string {
  switch (urgency) {
    case 'urgent': return '#C62828'
    case 'soon': return '#F9A825'
    case 'normal': return '#2E7D32'
    case 'expired': return '#9E9E9E'
    default: return '#94A3B8'
  }
}

export function getUrgencyLabel(urgency: Urgency): string {
  switch (urgency) {
    case 'urgent': return 'Dringend'
    case 'soon': return 'Bald'
    case 'normal': return 'Normal'
    case 'expired': return 'Abgelaufen'
    default: return 'Unbekannt'
  }
}

export function getUrgencyBgClass(urgency: Urgency): string {
  switch (urgency) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
    case 'soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'normal': return 'bg-green-100 text-green-800 border-green-200'
    case 'expired': return 'bg-gray-100 text-gray-500 border-gray-200'
    default: return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

export function getRelevanceBgClass(relevance: string | null): string {
  switch (relevance) {
    case 'sehr hoch': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'hoch': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'mittel': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-gray-100 text-gray-500 border-gray-200'
  }
}
