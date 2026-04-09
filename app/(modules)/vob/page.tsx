import { getDashboardData, getTotalTenderCount } from '@/lib/modules/vob/queries';
import { StatsOverview } from './_components/dashboard/StatsOverview';
import { CompanyCard } from './_components/dashboard/CompanyCard';
import { TrendChart } from './_components/dashboard/TrendChart';
import { DownloadReport } from './_components/export/DownloadReport';
import { RecentFeed } from './RecentFeed';

export const revalidate = 300;

/**
 * VOB Monitor – Hauptseite
 * Zeigt die Übersicht aller überwachten Unternehmen und aktuellen Ausschreibungen.
 */
export default async function VobDashboardPage(): Promise<React.JSX.Element> {
  const [{ companies, latestScan, recentTenders, trends }, totalTenders] = await Promise.all([
    getDashboardData(),
    getTotalTenderCount(),
  ]);

  const totalActive = new Set(
    recentTenders.filter((t) => t.status === 'active').map((t) => t.tender_id)
  ).size;
  const totalMatched = recentTenders.length;

  const companyTenders: Record<string, typeof recentTenders> = {};
  for (const t of recentTenders) {
    if (t.company_slug) {
      if (!companyTenders[t.company_slug]) companyTenders[t.company_slug] = [];
      companyTenders[t.company_slug].push(t);
    }
  }

  const latestTrends: Record<string, (typeof trends)[0]> = {};
  for (const t of trends) {
    if (!latestTrends[t.company_slug]) {
      latestTrends[t.company_slug] = t;
    }
  }

  return (
    <>
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">VOB Monitor</h1>
          <DownloadReport url={latestScan?.report_url ?? null} />
        </div>
        <StatsOverview
          latestScan={latestScan}
          totalActive={totalActive}
          totalMatched={totalMatched}
          totalTenders={totalTenders}
        />
        <div className="mt-10">
          <p className="text-sm font-medium text-foreground mb-4">Unternehmen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {companies.map((company) => (
              <CompanyCard
                key={company.slug}
                company={company}
                tenders={companyTenders[company.slug] ?? []}
                trend={latestTrends[company.slug]}
              />
            ))}
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          <TrendChart trends={trends} />
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm font-medium text-foreground mb-4">
              Neueste Ausschreibungen
            </p>
            <RecentFeed tenders={recentTenders} latestScanDate={latestScan?.scan_date} />
          </div>
        </div>
      </div>
    </>
  );
}
