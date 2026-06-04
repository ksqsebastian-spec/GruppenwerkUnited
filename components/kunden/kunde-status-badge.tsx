import { Badge } from '@/components/ui/badge';
import type { CustomerStatus } from '@/types';

const STATUS_CONFIG: Record<CustomerStatus, { label: string; className: string }> = {
  aktiv: { label: 'Aktiv', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  prospect: { label: 'Prospect', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200' },
  inaktiv: { label: 'Inaktiv', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200' },
  archiviert: { label: 'Archiviert', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
};

export const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = (Object.entries(STATUS_CONFIG) as [
  CustomerStatus,
  { label: string; className: string },
][]).map(([value, { label }]) => ({ value, label }));

interface KundeStatusBadgeProps {
  status: CustomerStatus;
}

export function KundeStatusBadge({ status }: KundeStatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
