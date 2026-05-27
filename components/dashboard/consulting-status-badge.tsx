import { cn } from '@/lib/utils';
import type { ConsultingStatus } from '@/types';

const STATUS_COLORS: Record<ConsultingStatus, string> = {
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
};

const STATUS_LABELS: Record<ConsultingStatus, string> = {
  green: 'OK',
  orange: 'Achtung',
  red: 'Fehlt',
};

interface ConsultingStatusBadgeProps {
  status: ConsultingStatus;
  count?: number;
  className?: string;
}

export function ConsultingStatusBadge({
  status,
  count,
  className,
}: ConsultingStatusBadgeProps): React.JSX.Element {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums', className)}
    >
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {count !== undefined ? (
        <span className="text-[#737373]">{count}</span>
      ) : (
        <span className="text-[#737373]">{STATUS_LABELS[status]}</span>
      )}
    </span>
  );
}

interface ConsultingStatusDotProps {
  status: ConsultingStatus;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function ConsultingStatusDot({
  status,
  onClick,
  disabled,
  size = 'md',
}: ConsultingStatusDotProps): React.JSX.Element {
  const color = STATUS_COLORS[status];
  const dim = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={STATUS_LABELS[status]}
      className={cn(
        'rounded-full shrink-0 transition-transform',
        dim,
        onClick && !disabled
          ? 'cursor-pointer hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'
          : 'cursor-default'
      )}
      style={{ backgroundColor: color }}
    />
  );
}
