'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Activity, ChevronRight, Car, AlertTriangle, Receipt, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardActivity } from '@/types';

interface RecentActivityProps {
  /** Liste der letzten Aktivitäten */
  activities: DashboardActivity[];
  /** Ob die Daten geladen werden */
  isLoading?: boolean;
}

/**
 * Zeigt die letzten Aktivitäten im Fuhrpark an
 */
export function RecentActivity({
  activities,
  isLoading = false,
}: RecentActivityProps): React.JSX.Element {
  // Icon je nach Aktivitätstyp zurückgeben
  const getActivityIcon = (type: DashboardActivity['type']): React.JSX.Element => {
    switch (type) {
      case 'vehicle':
        return <Car className="h-4 w-4 text-muted-foreground" />;
      case 'damage':
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      case 'cost':
        return <Receipt className="h-4 w-4 text-muted-foreground" />;
      case 'appointment':
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Letzte Aktivitäten
          </p>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Letzte Aktivitäten
          </p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Noch keine Aktivitäten vorhanden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Letzte Aktivitäten
        </p>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground text-xs"
        >
          <Link href="/fuhrpark/activity">
            Alle anzeigen
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="p-4 space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(activity.created_at), 'dd.MM.yyyy HH:mm', {
                  locale: de,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
