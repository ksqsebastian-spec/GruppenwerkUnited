import { getDashboardData, getTotalTenderCount } from '@/lib/queries'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { CompanyCard } from '@/components/dashboard/CompanyCard'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { Header } from '@/components/layout/Header'
import { DownloadReport } from '@/components/export/DownloadReport'
import { RecentFeed } from './RecentFeed'

export const revalidate = 300

export default async function DashboardPage() {
  const [{ companies, latestScan, recentTenders, trends }, totalTenders] = await Promise.all([
    getDashboardData(),
    getTotalTenderCount(),
  ])

  const totalActive = new Set(
    recentTenders.filter(t => t.status === 'active').map(t => t.tender_id)
  ).size
  const totalMatched = recentTenders.length

  const companyTenders: Record<string, typeof recentTenders> = {}
  for (const t of recentTenders) {
    if (t.company_slug) {
      if (!companyTenders[t.company_slug]) companyTenders[t.company_slug] = []
      companyTenders[t.company_slug].push(t)
    }
  }

  const latestTrends: Record<string, (typeof trends)[0]> = {}
  for (const t of trends) {
    if (!latestTrends[t.company_slug]) {
      latestTrends[t.company_slug] = t
    }
  }

  return (
    <>
      <Header latestScan={latestScan} />
      <div className="p-6 lg:p-8 max-w-[1200px]">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[18px] font-semibold text-neutral-900">Übersicht</h1>
          <DownloadReport url={latestScan?.report_url ?? null} />
        </div>

        {/* Stats */}
        <StatsOverview
          latestScan={latestScan}
          totalActive={totalActive}
          totalMatched={totalMatched}
          totalTenders={totalTenders}
        />

        {/* Companies */}
        <div className="mt-10">
          <p className="text-[13px] font-medium text-neutral-900 mb-4">Unternehmen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {companies.map(company => (
              <CompanyCard
                key={company.slug}
                company={company}
                tenders={companyTenders[company.slug] || []}
                trend={latestTrends[company.slug]}
              />
            ))}
          </div>
        </div>

        {/* Trend + Recent */}
        <div className="mt-10 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          <TrendChart trends={trends} />

          <div className="bg-white rounded-xl border border-neutral-200/60 p-5">
            <p className="text-[13px] font-medium text-neutral-900 mb-4">Neueste Ausschreibungen</p>
            <RecentFeed tenders={recentTenders} latestScanDate={latestScan?.scan_date} />
          </div>
        </div>
      </div>
    </>
  )
}
