'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  /** Titel der Statistik */
  title: string;
  /** Anzuzeigender Wert */
  value: string | number;
  /** Optionale Beschreibung unter dem Wert */
  description?: string;
  /** Icon für die Karte */
  icon: LucideIcon;
  /** Ob die Daten geladen werden */
  isLoading?: boolean;
  /** Optionale CSS-Klassen */
  className?: string;
  /** Variante für verschiedene Farben */
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

/**
 * Statistik-Karte für das Dashboard
 * Zeigt eine Kennzahl mit Icon und optionaler Beschreibung
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  className,
  variant = 'default',
}: StatCardProps): React.JSX.Element {
  const variantStyles = {
    default: 'text-muted-foreground',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    success: 'text-green-600',
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', variantStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
