import { getDashboardData, getTotalListingCount, getActiveListingCount, getTotalMatchCount } from '@/lib/modules/immo/queries';
import { StatsOverview } from './_components/dashboard/StatsOverview';
import { ProfileCard } from './_components/dashboard/ProfileCard';
import { TrendChart } from './_components/dashboard/TrendChart';
import { RecentFeed } from './RecentFeed';
import type { DashboardRow } from '@/lib/modules/immo/types';

export const dynamic = 'force-dynamic';

/**
 * Immobilien Monitor – Hauptseite
 * Zeigt die Übersicht aller Suchprofile und aktuellen Inserate.
 */
export default async function ImmoDashboardPage(): Promise<React.JSX.Element> {
  const [
    { profiles, latestScan, allMatches, scans },
    totalListings,
    activeListings,
    totalMatches,
  ] = await Promise.all([
    getDashboardData(),
    getTotalListingCount(),
    getActiveListingCount(),
    getTotalMatchCount(),
  ]);

  // Inserate je Suchprofil gruppieren (alle Treffer, nicht begrenzt)
  const profileListings: Record<string, DashboardRow[]> = {};
  for (const l of allMatches) {
    if (l.profile_slug) {
      if (!profileListings[l.profile_slug]) profileListings[l.profile_slug] = [];
      profileListings[l.profile_slug].push(l);
    }
  }

  // Aktuelle Inserate für den Feed (nur aktive)
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
          latestScan={latestScan}
          totalActive={activeListings}
          totalMatched={totalMatches}
          totalListings={totalListings}
        />
        <div className="mt-10">
          <p className="text-sm font-medium text-foreground mb-4">Suchprofile</p>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Noch keine Suchprofile konfiguriert.
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
              Aktuelle Inserate
            </p>
            <RecentFeed listings={recentListings} />
          </div>
        </div>
      </div>
    </>
  );
}
