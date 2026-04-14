import { createAdminClient } from '@/lib/supabase/admin'
import type { Company, VobScan, DashboardRow, CompanyTrend, CompanyWeeklyStat } from './types'

/**
 * Gibt alle Daten für das VOB Dashboard zurück.
 * Lädt Unternehmen, letzten Scan, alle Unternehmens-Matches und Trenddaten.
 * Verwendet den Admin-Client für sicheren Zugriff auf das vob-Schema.
 */
export async function getDashboardData(): Promise<{
  companies: Company[]
  latestScan: VobScan | null
  allMatches: DashboardRow[]
  trends: CompanyTrend[]
}> {
  const supabase = createAdminClient()

  const [
    { data: companies, error: companyError },
    { data: latestScanArr, error: scanError },
    { data: allMatches, error: matchError },
    { data: trends, error: trendError },
  ] = await Promise.all([
    supabase.schema('vob').from('companies').select('*').eq('active', true).order('name'),
    supabase.schema('vob').from('vob_scans').select('*').order('scan_date', { ascending: false }).limit(1),
    // Alle Matches aus dem Dashboard-View – nicht auf 20 limitieren, da sonst Company-Karten falsche Zahlen zeigen
    supabase.schema('vob').from('vob_dashboard').select('*').not('company_slug', 'is', null).order('deadline_date', { ascending: true }),
    supabase.schema('vob').from('company_trends').select('*').order('year', { ascending: false }).order('calendar_week', { ascending: false }).limit(300),
  ])

  if (companyError) console.error('Fehler beim Laden der Unternehmen:', companyError)
  if (scanError) console.error('Fehler beim Laden des Scans:', scanError)
  if (matchError) console.error('Fehler beim Laden der Matches:', matchError)
  if (trendError) console.error('Fehler beim Laden der Trends:', trendError)

  const latestScan = latestScanArr && latestScanArr.length > 0 ? (latestScanArr[0] as VobScan) : null

  return {
    companies: (companies ?? []) as Company[],
    latestScan,
    allMatches: (allMatches ?? []) as DashboardRow[],
    trends: (trends ?? []) as CompanyTrend[],
  }
}

/**
 * Gibt alle Ausschreibungen eines Unternehmens zurück.
 * Filtert optional nach Status (active/expired).
 */
export async function getCompanyTenders(slug: string, status?: string): Promise<DashboardRow[]> {
  const supabase = createAdminClient()

  let query = supabase
    .schema('vob')
    .from('vob_dashboard')
    .select('*')
    .eq('company_slug', slug)
    .order('deadline_date', { ascending: true })

  if (status === 'active') query = query.eq('status', 'active')
  if (status === 'expired') query = query.eq('status', 'expired')

  const { data, error } = await query

  if (error) console.error('Fehler beim Laden der Unternehmens-Ausschreibungen:', error)

  return (data ?? []) as DashboardRow[]
}

/**
 * Gibt die wöchentlichen Statistiken eines Unternehmens zurück (letzte 52 Wochen).
 */
export async function getCompanyStats(slug: string): Promise<CompanyWeeklyStat[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('vob')
    .from('company_weekly_stats')
    .select('*')
    .eq('company_slug', slug)
    .order('year', { ascending: false })
    .order('calendar_week', { ascending: false })
    .limit(52)

  if (error) console.error('Fehler beim Laden der Unternehmens-Statistiken:', error)

  return (data ?? []) as CompanyWeeklyStat[]
}

/**
 * Gibt ein einzelnes Unternehmen anhand des Slugs zurück.
 */
export async function getCompany(slug: string): Promise<Company | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('vob')
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) console.error('Fehler beim Laden des Unternehmens:', error)

  return data as Company | null
}

/**
 * Gibt Ausschreibungen paginiert zurück.
 * Nutzt den vob_dashboard View der Matches mit Ausschreibungen verbindet.
 */
export async function getAllTenders(page = 1, pageSize = 50): Promise<{ tenders: DashboardRow[]; total: number }> {
  const supabase = createAdminClient()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .schema('vob')
    .from('vob_dashboard')
    .select('*', { count: 'exact' })
    .order('deadline_date', { ascending: true })
    .range(from, to)

  if (error) console.error('Fehler beim Laden aller Ausschreibungen:', error)

  return { tenders: (data ?? []) as DashboardRow[], total: count ?? 0 }
}

/**
 * Gibt alle VOB-Scans in absteigender Reihenfolge zurück.
 */
export async function getAllScans(): Promise<VobScan[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('vob')
    .from('vob_scans')
    .select('*')
    .order('scan_date', { ascending: false })

  if (error) console.error('Fehler beim Laden der Scans:', error)

  return (data ?? []) as VobScan[]
}

/**
 * Gibt alle Matches einer Ausschreibung zurück (eine Zeile je Unternehmen).
 */
export async function getTenderById(id: string): Promise<DashboardRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('vob')
    .from('vob_dashboard')
    .select('*')
    .eq('tender_id', id)

  if (error) console.error('Fehler beim Laden der Ausschreibung:', error)

  return (data ?? []) as DashboardRow[]
}

/**
 * Gibt alle aktiven Unternehmen zurück.
 */
export async function getCompanies(): Promise<Company[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('vob')
    .from('companies')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) console.error('Fehler beim Laden der Unternehmen:', error)

  return (data ?? []) as Company[]
}

/**
 * Gibt die Gesamtanzahl aller Ausschreibungen zurück.
 */
export async function getTotalTenderCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .schema('vob')
    .from('vob_tenders')
    .select('*', { count: 'exact', head: true })

  if (error) console.error('Fehler beim Laden der Ausschreibungsanzahl:', error)

  return count ?? 0
}

/**
 * Gibt die Anzahl aktiver Ausschreibungen zurück.
 */
export async function getActiveTenderCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .schema('vob')
    .from('vob_tenders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) console.error('Fehler beim Laden der aktiven Ausschreibungen:', error)

  return count ?? 0
}

/**
 * Gibt die Gesamtanzahl aller Unternehmens-Matches zurück.
 */
export async function getTotalMatchCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .schema('vob')
    .from('vob_matches')
    .select('*', { count: 'exact', head: true })

  if (error) console.error('Fehler beim Laden der Match-Anzahl:', error)

  return count ?? 0
}
