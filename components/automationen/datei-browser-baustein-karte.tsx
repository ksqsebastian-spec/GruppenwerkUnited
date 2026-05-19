'use client';

import { X } from 'lucide-react';
import { DateiIcon } from './datei-browser-icon';
import type { Baustein } from './datei-browser-helpers';

export function BausteinKarte({
  baustein,
  onEntfernen,
}: {
  baustein: Baustein;
  onEntfernen: (id: string) => void;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 group relative">
      <div className="flex items-start gap-2">
        <DateiIcon type={baustein.type} logo={baustein.logo} className="h-4 w-4 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#000000] truncate">{baustein.name}</p>
          <p className="text-[10px] text-[#737373] mt-0.5 line-clamp-3 leading-relaxed">{baustein.kontext}</p>
        </div>
        <button
          onClick={() => onEntfernen(baustein.id)}
          className="shrink-0 h-4 w-4 flex items-center justify-center rounded-full text-[#737373] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
          title="Entfernen"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
