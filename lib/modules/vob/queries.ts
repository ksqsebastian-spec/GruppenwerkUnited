import { supabase } from '@/lib/supabase/client'
import type { Company, VobScan, DashboardRow, CompanyTrend, CompanyWeeklyStat } from './types'

export async function getDashboardData(): Promise<{
  companies: Company[]
  latestScan: VobScan | null
  recentTenders: DashboardRow[]
  trends: CompanyTrend[]
}> {
  const [
    { data: companies },
    { data: latestScan },
    { data: recentTenders },
    { data: trends }
  ] = await Promise.all([
    supabase.schema('vob').from('companies').select('*').eq('active', true).order('name'),
    supabase.schema('vob').from('vob_scans').select('*').order('scan_date', { ascending: false }).limit(1).single(),
    supabase.schema('vob').from('vob_dashboard').select('*').not('company_slug', 'is', null).order('created_at', { ascending: false }).limit(20),
    supabase.schema('vob').from('company_trends').select('*').order('year', { ascending: false }).order('calendar_week', { ascending: false }).limit(300)
  ])
  return {
    companies: (companies ?? []) as Company[],
    latestScan: latestScan as VobScan | null,
    recentTenders: (recentTenders ?? []) as DashboardRow[],
    trends: (trends ?? []) as CompanyTrend[]
  }
}

export async function getCompanyTenders(slug: string, status?: string): Promise<DashboardRow[]> {
  let query = supabase
    .schema('vob').from('vob_dashboard')
    .select('*')
    .eq('company_slug', slug)
    .order('deadline_date', { ascending: true })

  if (status === 'active') query = query.eq('status', 'active')
  if (status === 'expired') query = query.eq('status', 'expired')

  const { data } = await query
  return (data ?? []) as DashboardRow[]
}

export async function getCompanyStats(slug: string): Promise<CompanyWeeklyStat[]> {
  const { data } = await supabase
    .schema('vob').from('company_weekly_stats')
    .select('*')
    .eq('company_slug', slug)
    .order('year', { ascending: false })
    .order('calendar_week', { ascending: false })
    .limit(52)
  return (data ?? []) as CompanyWeeklyStat[]
}

export async function getCompany(slug: string): Promise<Company | null> {
  const { data } = await supabase
    .schema('vob').from('companies')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as Company | null
}

export async function getAllTenders(page = 1, pageSize = 50): Promise<{ tenders: DashboardRow[]; total: number }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count } = await supabase
    .schema('vob').from('vob_dashboard')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return { tenders: (data ?? []) as DashboardRow[], total: count ?? 0 }
}

export async function getAllScans(): Promise<VobScan[]> {
  const { data } = await supabase
    .schema('vob').from('vob_scans')
    .select('*')
    .order('scan_date', { ascending: false })
  return (data ?? []) as VobScan[]
}

export async function getTenderById(id: string): Promise<DashboardRow[]> {
  const { data } = await supabase
    .schema('vob').from('vob_dashboard')
    .select('*')
    .eq('tender_id', id)
  return (data ?? []) as DashboardRow[]
}

export async function getCompanies(): Promise<Company[]> {
  const { data } = await supabase
    .schema('vob').from('companies')
    .select('*')
    .eq('active', true)
    .order('name')
  return (data ?? []) as Company[]
}

export async function getMatchCountsByCompany(): Promise<Record<string, number>> {
  const { data } = await supabase
    .schema('vob').from('vob_matches')
    .select('company_slug')

  const counts: Record<string, number> = {}
  if (data) {
    for (const row of data) {
      counts[row.company_slug] = (counts[row.company_slug] || 0) + 1
    }
  }
  return counts
}

export async function getTotalTenderCount(): Promise<number> {
  const { count } = await supabase
    .schema('vob').from('vob_tenders')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
}
