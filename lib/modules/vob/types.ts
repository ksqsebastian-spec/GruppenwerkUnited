export interface Company {
  id: string
  name: string
  slug: string
  trades: string[]
  keywords: string[]
  color: string
  icon: string | null
  active: boolean
  created_at: string
}

export interface VobScan {
  id: string
  scan_date: string
  calendar_week: number
  year: number
  total_listings: number | null
  matched_count: number | null
  new_listings: number
  report_url: string | null
  created_at: string
}

export interface VobTender {
  id: string
  title: string
  authority: string | null
  deadline: string | null
  deadline_date: string | null
  category: string | null
  url: string
  status: string
  scan_id: string | null
  created_at: string
  updated_at: string
}

export interface VobMatch {
  id: string
  tender_id: string
  company_id: string
  company_slug: string
  relevance: string
  reason: string | null
  created_at: string
}

export interface DashboardRow {
  tender_id: string
  title: string
  authority: string | null
  deadline: string | null
  deadline_date: string | null
  category: string | null
  url: string
  status: string
  created_at: string
  company_slug: string | null
  company_name: string | null
  company_color: string | null
  relevance: string | null
  reason: string | null
  calendar_week: number | null
  year: number | null
  scan_date: string | null
  report_url: string | null
  urgency: 'urgent' | 'soon' | 'normal' | 'expired' | 'unknown'
  requested: boolean
}

export interface CompanyWeeklyStat {
  company_name: string
  company_slug: string
  color: string
  calendar_week: number
  year: number
  scan_date: string
  tender_count: number
}

export interface CompanyTrend extends CompanyWeeklyStat {
  prev_week_count: number | null
  week_change: number
}

export type Urgency = 'urgent' | 'soon' | 'normal' | 'expired' | 'unknown'
export type TenderStatus = 'active' | 'expired' | 'archived'
