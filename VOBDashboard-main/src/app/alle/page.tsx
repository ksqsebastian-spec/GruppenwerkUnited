import { getAllTenders, getCompanies } from '@/lib/queries'
import { Header } from '@/components/layout/Header'
import { AllTendersClient } from './AllTendersClient'

export const revalidate = 300

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AlleTendersPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const [{ tenders, total }, companies] = await Promise.all([
    getAllTenders(page, 50),
    getCompanies(),
  ])

  return (
    <>
      <Header />
      <div className="p-6 lg:p-8 max-w-[1200px]">
        <h1 className="text-[18px] font-semibold text-neutral-900 mb-6">Alle Ausschreibungen</h1>
        <AllTendersClient tenders={tenders} total={total} page={page} companies={companies} />
      </div>
    </>
  )
}
