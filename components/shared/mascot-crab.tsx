'use client';

import { BedDouble } from 'lucide-react';

/** Kleines Bett-Icon in der unteren linken Ecke */
export function MascotCrab(): React.JSX.Element {
  return (
    <div
      className="fixed z-50 bottom-4 left-4 select-none opacity-40 hover:opacity-70 transition-opacity"
      title="Werkbank"
    >
      <BedDouble className="h-5 w-5 text-primary" />
    </div>
  );
}
