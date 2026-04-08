import { getCompany, getCompanyTenders, getCompanyStats } from '@/lib/queries'
import { Header } from '@/components/layout/Header'
import { ExportButton } from '@/components/export/ExportButton'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { CompanyTenderList } from './CompanyTenderList'

export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params
  const [company, tenders, stats] = await Promise.all([
    getCompany(slug),
    getCompanyTenders(slug),
    getCompanyStats(slug),
  ])

  if (!company) notFound()

  const activeTenders = tenders.filter(t => t.status === 'active')

  return (
    <>
      <Header />
      <div className="p-6 lg:p-8 max-w-[1200px]">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: company.color }} />
              <h1 className="text-[18px] font-semibold text-neutral-900">{company.name}</h1>
            </div>
            {company.trades.length > 0 && (
              <div className="flex gap-1.5 flex-wrap ml-5">
                {company.trades.map(trade => (
                  <Badge key={trade} variant="outline" className="text-[10px] text-neutral-400 border-neutral-200 font-normal">
                    {trade}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[28px] font-semibold text-neutral-900 leading-none tabular-nums">{activeTenders.length}</p>
              <p className="text-[11px] text-neutral-400 mt-1">aktiv</p>
            </div>
            <ExportButton slug={slug} />
          </div>
        </div>

        <CompanyTenderList tenders={tenders} />
      </div>
    </>
  )
}
