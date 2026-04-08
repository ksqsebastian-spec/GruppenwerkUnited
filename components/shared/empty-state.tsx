import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon-Element */
  icon?: React.ReactNode;
  /** Titel */
  title: string;
  /** Beschreibung */
  description?: string;
  /** Aktions-Element (z.B. Button) */
  action?: React.ReactNode;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
