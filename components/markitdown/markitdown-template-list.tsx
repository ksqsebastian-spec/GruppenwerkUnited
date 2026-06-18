'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { MarkitdownTemplate } from '@/types';

interface MarkitdownTemplateListProps {
  templates: MarkitdownTemplate[];
  onSelect: (t: MarkitdownTemplate) => void;
}

export function MarkitdownTemplateList({
  templates,
  onSelect,
}: MarkitdownTemplateListProps): React.JSX.Element {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((t) => {
        const preview = t.markdown.split('\n').slice(0, 3).join('\n').slice(0, 240);
        const created = new Date(t.created_at);
        const relativ = formatDistanceToNow(created, { locale: de, addSuffix: true });
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t)}
              className="flex h-full w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40 hover:shadow-sm"
            >
              <div>
                <h3 className="font-medium leading-tight">{t.titel}</h3>
                {t.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {t.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{t.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {t.beschreibung && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.beschreibung}</p>
              )}
              <pre className="line-clamp-3 max-h-16 overflow-hidden whitespace-pre-wrap rounded bg-muted/40 p-2 font-mono text-[11px] leading-tight text-muted-foreground">
                {preview}
              </pre>
              <p className="mt-auto text-xs text-muted-foreground">
                von {t.saved_by} · <span title={format(created, 'PPpp', { locale: de })}>{relativ}</span>
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
