'use client';

import { Badge } from '@/components/ui/badge';
import type { UvvCheckStatus } from '@/types';

interface UvvStatusBadgeProps {
  status: UvvCheckStatus;
}

/**
 * Status-Badge für UVV-Unterweisungen
 */
export function UvvStatusBadge({ status }: UvvStatusBadgeProps): JSX.Element {
  const statusConfig: Record<
    UvvCheckStatus,
    { label: string; variant: 'destructive' | 'warning' | 'success' }
  > = {
    overdue: { label: 'Überfällig', variant: 'destructive' },
    due_soon: { label: 'Bald fällig', variant: 'warning' },
    ok: { label: 'In Ordnung', variant: 'success' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
