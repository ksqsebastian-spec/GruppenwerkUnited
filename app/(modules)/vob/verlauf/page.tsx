import { getAllScans } from '@/lib/modules/vob/queries';
import { formatDate } from '@/lib/utils';
import { DownloadReport } from '../_components/export/DownloadReport';
import { AppLayout } from '@/components/layout/app-layout';

export const revalidate = 300;

/**
 * VOB Monitor – Scan-Verlauf
 */
export default async function VerlaufPage(): Promise<JSX.Element> {
  const scans = await getAllScans();

  return (
    <AppLayout>
      <div className="max-w-[1200px]">
        <h1 className="text-[18px] font-semibold text-neutral-900 mb-6">Verlauf</h1>

        {scans.length === 0 ? (
          <p className="text-[12px] text-neutral-400 py-12 text-center">
            Noch keine Scans vorhanden.
          </p>
        ) : (
          <div className="mt-6 bg-white rounded-xl border border-neutral-200/60 divide-y divide-neutral-100">
            {scans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-6">
                  <span className="text-[15px] font-semibold text-neutral-900 tabular-nums w-14">
                    KW {scan.calendar_week}
                  </span>
                  <span className="text-[12px] text-neutral-400">{formatDate(scan.scan_date)}</span>
                  <div className="hidden sm:flex gap-4 text-[11px] text-neutral-400">
                    <span>{scan.total_listings ?? 0} gesamt</span>
                    <span>{scan.matched_count ?? 0} matches</span>
                    <span>{scan.new_listings ?? 0} neu</span>
                  </div>
                </div>
                <DownloadReport url={scan.report_url} label="DOCX" />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
