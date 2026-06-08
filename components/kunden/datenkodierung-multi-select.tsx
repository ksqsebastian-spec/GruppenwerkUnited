'use client';

import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Datenkodierung } from '@/types';

interface DatenkodierungMultiSelectProps {
  /** Alle verfügbaren Datenkodierungs-Einträge des Mandanten. */
  optionen: Datenkodierung[];
  /** Ausgewählte Codes. */
  ausgewaehlt: string[];
  onToggle: (code: string) => void;
}

/**
 * Such- und Mehrfachauswahl für Datenkodierungen. Ersetzt die unübersichtliche
 * Checkbox-Liste, sobald viele Einträge existieren: Suchfeld filtert,
 * ausgewählte erscheinen als entfernbare Chips, die Trefferliste ist scrollbar.
 */
export function DatenkodierungMultiSelect({
  optionen,
  ausgewaehlt,
  onToggle,
}: DatenkodierungMultiSelectProps): React.JSX.Element {
  const [suche, setSuche] = useState('');

  const gefiltert = useMemo(() => {
    const s = suche.trim().toLowerCase();
    if (!s) return optionen;
    return optionen.filter(
      (d) => d.code.toLowerCase().includes(s) || d.name.toLowerCase().includes(s),
    );
  }, [optionen, suche]);

  const ausgewaehlteEintraege = optionen.filter((d) => ausgewaehlt.includes(d.code));

  return (
    <div className="space-y-2">
      {/* Ausgewählte Chips */}
      {ausgewaehlteEintraege.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ausgewaehlteEintraege.map((d) => (
            <Badge key={d.code} variant="secondary" className="gap-1 pr-1">
              <span className="font-medium">{d.code}</span>
              <span className="max-w-[120px] truncate text-muted-foreground">· {d.name}</span>
              <button
                type="button"
                onClick={() => onToggle(d.code)}
                className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
                aria-label={`${d.code} entfernen`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Suchfeld */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Datenkodierung suchen (Code oder Name)…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Trefferliste */}
      <ul className="max-h-44 divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
        {gefiltert.length === 0 ? (
          <li className="p-3 text-center text-xs text-muted-foreground">Keine Treffer</li>
        ) : (
          gefiltert.map((d) => {
            const checked = ausgewaehlt.includes(d.code);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onToggle(d.code)}
                  className="flex w-full items-center gap-2 p-2 text-left text-sm transition-colors hover:bg-muted/40"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                    }`}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 truncate">
                    <span className="font-medium">{d.code}</span>
                    <span className="text-muted-foreground"> · {d.name}</span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
