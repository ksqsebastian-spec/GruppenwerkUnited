import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Status-Konfigurationen
const statusConfigs = {
  // Fahrzeugstatus
  active: { label: 'Aktiv', variant: 'success' as const },
  archived: { label: 'Archiviert', variant: 'secondary' as const },

  // Schadensstatus
  reported: { label: 'Gemeldet', variant: 'warning' as const },
  approved: { label: 'Freigegeben', variant: 'default' as const },
  in_repair: { label: 'In Reparatur', variant: 'default' as const },
  completed: { label: 'Abgeschlossen', variant: 'success' as const },

  // Terminstatus
  pending: { label: 'Ausstehend', variant: 'warning' as const },
  overdue: { label: 'Überfällig', variant: 'danger' as const },
};

type StatusType = keyof typeof statusConfigs;

interface StatusBadgeProps {
  /** Status-Wert */
  status: StatusType;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.JSX.Element {
  const config = statusConfigs[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
