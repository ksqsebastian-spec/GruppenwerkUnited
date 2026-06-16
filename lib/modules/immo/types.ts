export interface SearchProfile {
  id: string
  name: string
  slug: string
  city: string | null
  keywords: string[]
  max_price: number | null
  min_rooms: number | null
  transaction_type: string | null
  color: string
  icon: string | null
  active: boolean
  created_at: string
}

export interface ImmoScan {
  id: string
  scan_date: string
  calendar_week: number
  year: number
  total_listings: number | null
  matched_count: number | null
  new_listings: number
  created_at: string
}

export interface ImmoListing {
  id: string
  title: string
  price: number | null
  size_sqm: number | null
  rooms: number | null
  location: string | null
  property_type: string | null
  transaction_type: string | null
  portal: string | null
  url: string
  status: string
  scan_id: string | null
  created_at: string
}

export interface ImmoMatch {
  id: string
  listing_id: string
  profile_id: string
  profile_slug: string
  relevance: string
  reason: string | null
}

export interface DashboardRow {
  listing_id: string
  title: string
  price: number | null
  size_sqm: number | null
  rooms: number | null
  price_per_sqm: number | null
  location: string | null
  property_type: string | null
  transaction_type: string | null
  portal: string | null
  url: string
  status: string
  profile_name: string | null
  profile_slug: string | null
  profile_color: string | null
  relevance: string | null
  reason: string | null
  scan_id: string | null
  created_at: string
}

export interface ProfileWeeklyStat {
  profile_name: string
  profile_slug: string
  color: string
  calendar_week: number
  year: number
  scan_date: string
  listing_count: number
}

export interface ProfileTrend extends ProfileWeeklyStat {
  prev_week_count: number | null
  week_change: number
}

export type ListingStatus = 'active' | 'inactive' | 'archived'
