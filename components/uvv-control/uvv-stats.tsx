'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useUvvControlStats } from '@/hooks/use-uvv-control';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Statistik-Karten für das UVV-Dashboard
 */
export function UvvStats(): React.JSX.Element {
  const { data: stats, isLoading } = useUvvControlStats();

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { title: 'Fahrer gesamt', value: stats?.totalDrivers ?? 0 },
    { title: 'Überfällig', value: stats?.overdueCount ?? 0 },
    { title: 'Bald fällig', value: stats?.dueSoonCount ?? 0 },
    { title: 'In Ordnung', value: stats?.okCount ?? 0 },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{item.title}</p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
