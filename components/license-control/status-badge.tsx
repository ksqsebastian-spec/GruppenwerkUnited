'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LicenseCheckStatus } from '@/types';

interface LicenseStatusBadgeProps {
  status: LicenseCheckStatus;
  className?: string;
}

const statusConfig: Record<LicenseCheckStatus, { label: string; className: string }> = {
  overdue: {
    label: 'Überfällig',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  due_soon: {
    label: 'Bald fällig',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  },
  ok: {
    label: 'In Ordnung',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
};

/**
 * Badge-Komponente für den Status einer Führerscheinkontrolle
 */
export function LicenseStatusBadge({
  status,
  className,
}: LicenseStatusBadgeProps): React.JSX.Element {
  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
