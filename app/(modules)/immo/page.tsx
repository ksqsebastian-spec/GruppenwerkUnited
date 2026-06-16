import { getDashboardData } from '@/lib/modules/immo/queries';
import { StatsOverview } from './_components/dashboard/StatsOverview';
import { ProfileCard } from './_components/dashboard/ProfileCard';
import { TrendChart } from './_components/dashboard/TrendChart';
import { RecentFeed } from './RecentFeed';
import { averageFaktor, averageRendite, countDeals } from '@/lib/modules/immo/utils';
import type { DashboardRow } from '@/lib/modules/immo/types';

export const dynamic = 'force-dynamic';

/**
 * Immobilien Monitor – Hauptseite
 * Investment-Deal-Scanner: Übersicht aller Städte und besten Objekte nach Kaufpreisfaktor.
 */
export default async function ImmoDashboardPage(): Promise<React.JSX.Element> {
  const { profiles, allMatches, scans } = await getDashboardData();

  // Eindeutige Objekte (View kann je Stadt-Zuordnung Duplikate liefern)
  const seen = new Set<string>();
  const uniqueListings = allMatches.filter((l) => {
    if (seen.has(l.listing_id)) return false;
    seen.add(l.listing_id);
    return true;
  });

  const dealCount = countDeals(uniqueListings);
  const avgFaktor = averageFaktor(uniqueListings);
  const avgRendite = averageRendite(uniqueListings);
  const cityCount = profiles.length;

  // Objekte je Stadt gruppieren (alle Treffer, nicht begrenzt)
  const profileListings: Record<string, DashboardRow[]> = {};
  for (const l of allMatches) {
    if (l.profile_slug) {
      if (!profileListings[l.profile_slug]) profileListings[l.profile_slug] = [];
      profileListings[l.profile_slug].push(l);
    }
  }

  // Aktuelle Objekte für den Feed (nur aktive, beste Deals zuerst)
  const recentListings = allMatches
    .filter((l) => l.status === 'active')
    .slice(0, 15);

  return (
    <>
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Immobilien Monitor</h1>
        </div>
        <StatsOverview
          dealCount={dealCount}
          avgFaktor={avgFaktor}
          avgRendite={avgRendite}
          cityCount={cityCount}
        />
        <div className="mt-10">
          <p className="text-sm font-medium text-foreground mb-4">Städte</p>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Noch keine Städte konfiguriert.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.slug}
                  profile={profile}
                  listings={profileListings[profile.slug] ?? []}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-10 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          <TrendChart scans={scans} />
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm font-medium text-foreground mb-4">
              Aktuelle Objekte
            </p>
            <RecentFeed listings={recentListings} />
          </div>
        </div>
      </div>
    </>
  );
}
