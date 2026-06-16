import { getAllListings } from '@/lib/modules/immo/queries';
import { AllListingsClient } from './AllListingsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * Immobilien Monitor – Alle Inserate
 */
export default async function AlleListingsPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const { listings, total } = await getAllListings(page, 50);

  return (
    <>
      <div className="max-w-[1200px]">
        <h1 className="text-[18px] font-semibold text-neutral-900 mb-6">
          Alle Objekte
        </h1>
        <AllListingsClient listings={listings} total={total} page={page} />
      </div>
    </>
  );
}
