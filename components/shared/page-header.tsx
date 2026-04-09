import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  /** Seitentitel */
  title: string;
  /** Optionale Beschreibung */
  description?: string;
  /** Aktions-Elemente (z.B. Buttons) */
  actions?: React.ReactNode;
  /** Children als Alternative zu actions */
  children?: React.ReactNode;
  /** Zurück-Link URL */
  backHref?: string;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  backHref,
  className,
}: PageHeaderProps): React.JSX.Element {
  const actionContent = actions || children;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {backHref && (
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Zurück</span>
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actionContent && <div className="flex items-center gap-2">{actionContent}</div>}
    </div>
  );
}
