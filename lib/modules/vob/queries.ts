import sql from '@/lib/db';
import type { Company, VobScan, DashboardRow, CompanyTrend, CompanyWeeklyStat } from './types';

export async function getDashboardData(): Promise<{
  companies: Company[];
  latestScan: VobScan | null;
  allMatches: DashboardRow[];
  trends: CompanyTrend[];
}> {
  const [companies, scans, allMatches, trends] = await Promise.all([
    sql`SELECT * FROM vob.companies WHERE active = true ORDER BY name`,
    sql`SELECT * FROM vob.vob_scans ORDER BY scan_date DESC LIMIT 1`,
    sql`SELECT * FROM vob.vob_dashboard WHERE company_slug IS NOT NULL ORDER BY deadline_date ASC`,
    sql`SELECT * FROM vob.company_trends ORDER BY year DESC, calendar_week DESC LIMIT 300`,
  ]);

  return {
    companies: companies as Company[],
    latestScan: scans[0] ? (scans[0] as VobScan) : null,
    allMatches: allMatches as DashboardRow[],
    trends: trends as CompanyTrend[],
  };
}

export async function getCompanyTenders(slug: string, status?: string): Promise<DashboardRow[]> {
  const rows = await sql`
    SELECT * FROM vob.vob_dashboard
    WHERE company_slug = ${slug}
      AND (${status ?? null} IS NULL OR status = ${status ?? null})
    ORDER BY deadline_date ASC
  `;
  return rows as DashboardRow[];
}

export async function getCompanyStats(slug: string): Promise<CompanyWeeklyStat[]> {
  const rows = await sql`
    SELECT * FROM vob.company_weekly_stats
    WHERE company_slug = ${slug}
    ORDER BY year DESC, calendar_week DESC
    LIMIT 52
  `;
  return rows as CompanyWeeklyStat[];
}

export async function getCompany(slug: string): Promise<Company | null> {
  const rows = await sql`SELECT * FROM vob.companies WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? (rows[0] as Company) : null;
}

export async function getAllTenders(page = 1, pageSize = 50): Promise<{ tenders: DashboardRow[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const [tenders, countRows] = await Promise.all([
    sql`SELECT * FROM vob.vob_dashboard ORDER BY deadline_date ASC LIMIT ${pageSize} OFFSET ${offset}`,
    sql`SELECT COUNT(*) AS count FROM vob.vob_dashboard`,
  ]);
  return {
    tenders: tenders as DashboardRow[],
    total: Number((countRows[0] as { count: string }).count),
  };
}

export async function getAllScans(): Promise<VobScan[]> {
  return sql`SELECT * FROM vob.vob_scans ORDER BY scan_date DESC` as Promise<VobScan[]>;
}

export async function getTenderById(id: string): Promise<DashboardRow[]> {
  return sql`SELECT * FROM vob.vob_dashboard WHERE tender_id = ${id}` as Promise<DashboardRow[]>;
}

export async function getCompanies(): Promise<Company[]> {
  return sql`SELECT * FROM vob.companies WHERE active = true ORDER BY name` as Promise<Company[]>;
}

export async function getTotalTenderCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS count FROM vob.vob_tenders`;
  return Number((rows[0] as { count: string }).count);
}

export async function getActiveTenderCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS count FROM vob.vob_tenders WHERE status = 'active'`;
  return Number((rows[0] as { count: string }).count);
}

export async function getTotalMatchCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS count FROM vob.vob_matches`;
  return Number((rows[0] as { count: string }).count);
}
