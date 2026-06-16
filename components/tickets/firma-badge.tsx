import { cn } from '@/lib/utils';
import { firmaBadgeClass, firmaName } from '@/lib/tickets/firmen';

interface FirmaBadgeProps {
  firma: string | null | undefined;
  className?: string;
}

/** Farbkodiertes Badge für eine Firma (Ticket-/Personen-System). */
export function FirmaBadge({ firma, className }: FirmaBadgeProps): React.JSX.Element | null {
  if (!firma) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        firmaBadgeClass(firma),
        className,
      )}
    >
      {firmaName(firma)}
    </span>
  );
}
