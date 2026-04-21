'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLicenseControlStats } from '@/hooks/use-license-control';

/**
 * Statistik-Karten für das Führerscheinkontrolle-Dashboard
 */
export function LicenseControlStats(): React.JSX.Element {
  const { data: stats, isLoading } = useLicenseControlStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { label: 'Mitarbeiter gesamt', value: stats?.totalEmployees ?? 0 },
    { label: 'Überfällig', value: stats?.overdueCount ?? 0 },
    { label: 'Bald fällig', value: stats?.dueSoonCount ?? 0 },
    { label: 'In Ordnung', value: stats?.okCount ?? 0 },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
