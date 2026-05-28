import { URGENCY_CONFIG } from '@/lib/tickets/config';
import type { TicketUrgency } from '@/types';

interface TicketUrgencyBadgeProps {
  urgency: TicketUrgency;
}

export function TicketUrgencyBadge({ urgency }: TicketUrgencyBadgeProps): React.JSX.Element {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
