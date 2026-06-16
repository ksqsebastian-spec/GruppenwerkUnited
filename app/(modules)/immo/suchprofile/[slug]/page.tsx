import { getProfile, getProfileListings } from '@/lib/modules/immo/queries';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { ProfileListingList } from './ProfileListingList';
import { formatFaktor, formatPricePerSqm, countDeals } from '@/lib/modules/immo/utils';
import type { SearchProfile } from '@/lib/modules/immo/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Immobilien Monitor – Suchprofil-Detailseite
 */
export default async function ProfilePage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const [profile, listings] = await Promise.all([
    getProfile(slug),
    getProfileListings(slug),
  ]);

  if (!profile) notFound();

  // Nach notFound()-Aufruf ist profile garantiert nicht null
  const safeProfile = profile as SearchProfile;
  const activeListings = listings.filter((l) => l.status === 'active');
  const deals = countDeals(activeListings);

  const tags: string[] = [];
  if (safeProfile.max_factor) tags.push(`max. Faktor ${formatFaktor(safeProfile.max_factor)}`);
  if (safeProfile.est_rent_per_sqm) tags.push(`Ø Miete ${formatPricePerSqm(safeProfile.est_rent_per_sqm)}`);
  if (safeProfile.transaction_type) tags.push(safeProfile.transaction_type);

  return (
    <>
      <div className="max-w-[1200px]">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: safeProfile.color }}
              />
              <h1 className="text-[18px] font-semibold text-neutral-900">{safeProfile.city ?? safeProfile.name}</h1>
            </div>
            {(tags.length > 0 || safeProfile.keywords.length > 0) && (
              <div className="flex gap-1.5 flex-wrap ml-5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] text-neutral-400 border-neutral-200 font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
                {safeProfile.keywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant="outline"
                    className="text-[10px] text-neutral-400 border-neutral-200 font-normal"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-[28px] font-semibold text-neutral-900 leading-none tabular-nums">
              {deals}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">Deals</p>
          </div>
        </div>
        <ProfileListingList listings={listings} />
      </div>
    </>
  );
}
