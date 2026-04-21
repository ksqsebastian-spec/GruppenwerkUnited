'use client';

import { Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
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
    {
      label: 'Mitarbeiter gesamt',
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Überfällig',
      value: stats?.overdueCount ?? 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Bald fällig',
      value: stats?.dueSoonCount ?? 0,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'In Ordnung',
      value: stats?.okCount ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
