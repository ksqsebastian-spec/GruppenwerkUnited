'use client';

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
  // Farbvarianten für den Zahlenwert
  const valueStyles = {
    default: 'text-foreground',
    warning: 'text-yellow-600',
    danger: 'text-red-500',
    success: 'text-foreground',
  };

  if (isLoading) {
    return (
      <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={cn('text-[28px] font-semibold leading-none tracking-tight', valueStyles[variant])}>
        {value}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
