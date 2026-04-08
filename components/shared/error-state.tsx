import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  /** Fehlermeldung */
  message: string;
  /** Callback für Retry-Button */
  onRetry?: () => void;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

export function ErrorState({
  message,
  onRetry,
  className,
}: ErrorStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="mb-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-destructive">Fehler</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      )}
    </div>
  );
}
