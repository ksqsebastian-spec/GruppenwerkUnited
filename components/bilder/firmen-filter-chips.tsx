'use client';

import { FIRMEN_CONFIG, firmaBadgeClass } from '@/lib/tickets/firmen';
import { cn } from '@/lib/utils';

interface FirmenFilterChipsProps {
  ausgewaehlt: string[];
  onToggle: (slug: string) => void;
  onReset: () => void;
}

/**
 * Farbige Chip-Reihe für die Firmen-Filterung. Mehrfachauswahl: Bilder
 * werden gezeigt, wenn sie MINDESTENS EINEM gewählten Tag entsprechen.
 */
export function FirmenFilterChips({
  ausgewaehlt,
  onToggle,
  onReset,
}: FirmenFilterChipsProps): React.JSX.Element {
  const alle = ausgewaehlt.length === 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onReset}
        className={cn(
          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          alle
            ? 'border-black bg-black text-white'
            : 'border-[#e5e5e5] bg-white text-[#525252] hover:border-[#a3a3a3]',
        )}
      >
        Alle
      </button>
      {FIRMEN_CONFIG.map((f) => {
        const aktiv = ausgewaehlt.includes(f.id);
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onToggle(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              aktiv ? firmaBadgeClass(f.id) + ' ring-2 ring-offset-1' : 'border-[#e5e5e5] bg-white text-[#525252] hover:border-[#a3a3a3]',
            )}
            style={aktiv ? { boxShadow: `0 0 0 2px ${f.dot}33` } : undefined}
          >
            {f.name}
          </button>
        );
      })}
    </div>
  );
}
