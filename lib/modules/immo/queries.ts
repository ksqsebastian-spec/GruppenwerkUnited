import { createAdminClient } from '@/lib/supabase/admin'
import type { SearchProfile, ImmoScan, DashboardRow } from './types'

/**
 * Gibt alle Daten für das Immobilien Dashboard zurück.
 * Lädt Suchprofile, letzten Scan und alle Profil-Treffer.
 * Verwendet den Admin-Client für sicheren Zugriff auf das immo-Schema.
 */
export async function getDashboardData(): Promise<{
  profiles: SearchProfile[]
  latestScan: ImmoScan | null
  allMatches: DashboardRow[]
  scans: ImmoScan[]
}> {
  const supabase = createAdminClient()

  const [
    { data: profiles, error: profileError },
    { data: scans, error: scanError },
    { data: allMatches, error: matchError },
  ] = await Promise.all([
    supabase.schema('immo').from('search_profiles').select('*').eq('active', true).order('name'),
    supabase.schema('immo').from('immo_scans').select('*').order('scan_date', { ascending: false }).limit(52),
    // Alle Treffer aus dem Dashboard-View – nicht limitieren, da sonst Stadt-Karten falsche Zahlen zeigen
    // Standardsortierung: bester Deal (niedrigster Faktor) zuerst
    supabase.schema('immo').from('immo_dashboard').select('*').not('profile_slug', 'is', null).order('faktor', { ascending: true, nullsFirst: false }),
  ])

  if (profileError) console.error('Fehler beim Laden der Suchprofile:', profileError)
  if (scanError) console.error('Fehler beim Laden der Scans:', scanError)
  if (matchError) console.error('Fehler beim Laden der Treffer:', matchError)

  const scanList = (scans ?? []) as ImmoScan[]
  const latestScan = scanList.length > 0 ? scanList[0] : null

  return {
    profiles: (profiles ?? []) as SearchProfile[],
    latestScan,
    allMatches: (allMatches ?? []) as DashboardRow[],
    scans: scanList,
  }
}

/**
 * Gibt alle Inserate eines Suchprofils zurück.
 * Filtert optional nach Status (active/inactive).
 */
export async function getProfileListings(slug: string, status?: string): Promise<DashboardRow[]> {
  const supabase = createAdminClient()

  let query = supabase
    .schema('immo')
    .from('immo_dashboard')
    .select('*')
    .eq('profile_slug', slug)
    .order('faktor', { ascending: true, nullsFirst: false })

  if (status === 'active') query = query.eq('status', 'active')
  if (status === 'inactive') query = query.eq('status', 'inactive')

  const { data, error } = await query

  if (error) console.error('Fehler beim Laden der Profil-Inserate:', error)

  return (data ?? []) as DashboardRow[]
}

/**
 * Gibt ein einzelnes Suchprofil anhand des Slugs zurück.
 */
export async function getProfile(slug: string): Promise<SearchProfile | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('immo')
    .from('search_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) console.error('Fehler beim Laden des Suchprofils:', error)

  return data as SearchProfile | null
}

/**
 * Gibt Inserate paginiert zurück.
 * Nutzt den immo_dashboard View, der Treffer mit Inseraten verbindet.
 */
export async function getAllListings(page = 1, pageSize = 50): Promise<{ listings: DashboardRow[]; total: number }> {
  const supabase = createAdminClient()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .schema('immo')
    .from('immo_dashboard')
    .select('*', { count: 'exact' })
    .order('faktor', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (error) console.error('Fehler beim Laden aller Inserate:', error)

  return { listings: (data ?? []) as DashboardRow[], total: count ?? 0 }
}

/**
 * Gibt alle immo-Scans in absteigender Reihenfolge zurück.
 */
export async function getAllScans(): Promise<ImmoScan[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('immo')
    .from('immo_scans')
    .select('*')
    .order('scan_date', { ascending: false })

  if (error) console.error('Fehler beim Laden der Scans:', error)

  return (data ?? []) as ImmoScan[]
}

/**
 * Gibt alle aktiven Suchprofile zurück.
 */
export async function getProfiles(): Promise<SearchProfile[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('immo')
    .from('search_profiles')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) console.error('Fehler beim Laden der Suchprofile:', error)

  return (data ?? []) as SearchProfile[]
}

/**
 * Gibt die Gesamtanzahl aller Inserate zurück.
 */
export async function getTotalListingCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .schema('immo')
    .from('immo_listings')
    .select('*', { count: 'exact', head: true })

  if (error) console.error('Fehler beim Laden der Inseratsanzahl:', error)

  return count ?? 0
}

/**
 * Gibt die Anzahl aktiver Inserate zurück.
 */
export async function getActiveListingCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .schema('immo')
    .from('immo_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) console.error('Fehler beim Laden der aktiven Inserate:', error)

  return count ?? 0
}

/**
 * Gibt die Gesamtanzahl aller Profil-Treffer zurück.
 */
export async function getTotalMatchCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .schema('immo')
    .from('immo_matches')
    .select('*', { count: 'exact', head: true })

  if (error) console.error('Fehler beim Laden der Treffer-Anzahl:', error)

  return count ?? 0
}
