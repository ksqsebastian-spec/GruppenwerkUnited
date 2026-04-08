'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cost } from '@/types';

interface CostSummaryProps {
  /** Liste der Kosten für die Zusammenfassung */
  costs: Cost[];
  /** Ob die Daten geladen werden */
  isLoading?: boolean;
}

/**
 * Formatiert einen Euro-Betrag
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Zusammenfassung der Kosten nach Kategorien
 */
export function CostSummary({ costs, isLoading = false }: CostSummaryProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kostenübersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Kosten nach Kategorie gruppieren (mit Name als Key)
  const costsByCategory = costs.reduce<Record<string, { name: string; amount: number }>>((acc, cost) => {
    const categoryName = cost.cost_type?.name ?? 'Sonstiges';
    if (!acc[categoryName]) {
      acc[categoryName] = { name: categoryName, amount: 0 };
    }
    acc[categoryName].amount += cost.amount;
    return acc;
  }, {});

  // Nach Betrag sortieren (höchste zuerst)
  const sortedCategories = Object.values(costsByCategory).sort(
    (a, b) => b.amount - a.amount
  );

  // Gesamtsumme
  const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);

  if (sortedCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kostenübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Noch keine Kosten erfasst.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kostenübersicht</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedCategories.map((category) => {
          const percentage = ((category.amount / totalAmount) * 100).toFixed(1);
          return (
            <div key={category.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{category.name}</span>
                <span className="font-medium">{formatCurrency(category.amount)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {percentage}%
              </p>
            </div>
          );
        })}

        {/* Trennlinie und Summe */}
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between font-medium">
            <span>Gesamt</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
