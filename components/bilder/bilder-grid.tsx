'use client';

import { firmaDot } from '@/lib/tickets/firmen';
import type { BildMitUrl } from '@/hooks/use-bilder';

interface BilderGridProps {
  bilder: BildMitUrl[];
  onSelect: (bild: BildMitUrl) => void;
}

export function BilderGrid({ bilder, onSelect }: BilderGridProps): React.JSX.Element {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {bilder.map((b) => (
        <li key={b.id}>
          <button
            type="button"
            onClick={() => onSelect(b)}
            className="group block w-full overflow-hidden rounded-lg border border-border bg-card text-left transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.public_url}
                alt={b.titel ?? b.dateiname}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Firmen-Punkte */}
              {b.firmen_tags.length > 0 && (
                <div className="absolute left-1.5 top-1.5 flex gap-1">
                  {b.firmen_tags.slice(0, 4).map((slug) => (
                    <span
                      key={slug}
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white/80"
                      style={{ backgroundColor: firmaDot(slug) }}
                      aria-hidden
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-xs font-medium">{b.titel ?? b.dateiname}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                von {b.uploaded_by}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
