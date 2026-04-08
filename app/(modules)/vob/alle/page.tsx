import { getAllTenders, getCompanies } from '@/lib/modules/vob/queries';
import { AllTendersClient } from './AllTendersClient';
import { AppLayout } from '@/components/layout/app-layout';

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * VOB Monitor – Alle Ausschreibungen
 */
export default async function AlleTendersPage({ searchParams }: PageProps): Promise<JSX.Element> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const [{ tenders, total }, companies] = await Promise.all([
    getAllTenders(page, 50),
    getCompanies(),
  ]);

  return (
    <AppLayout>
      <div className="max-w-[1200px]">
        <h1 className="text-[18px] font-semibold text-neutral-900 mb-6">
          Alle Ausschreibungen
        </h1>
        <AllTendersClient tenders={tenders} total={total} page={page} companies={companies} />
      </div>
    </AppLayout>
  );
}
