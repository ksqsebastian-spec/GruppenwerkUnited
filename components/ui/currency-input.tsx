'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Parst eine deutsche Zahlenformat-Eingabe zu einer JavaScript-Zahl.
 * "1.234,56" → 1234.56
 * "1234,56" → 1234.56
 * "1234.56" → 1234.56 (auch englisches Format akzeptieren)
 */
function parseGermanNumber(input: string): number | undefined {
  if (!input || input.trim() === '') {
    return undefined;
  }

  let cleaned = input.trim();

  // Prüfen ob deutsches Format (Komma als Dezimaltrenner)
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // Deutsches Format: 1.234,56 → Punkte sind Tausender-Trenner
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // Nur Komma: 1234,56 → Komma ist Dezimaltrenner
    cleaned = cleaned.replace(',', '.');
  }
  // Sonst: englisches Format oder nur Punkte als Tausender → direkt parsen

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Formatiert eine Zahl im deutschen Format.
 * 1234.56 → "1.234,56"
 */
function formatGermanNumber(num: number | undefined, decimals: number = 2): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '';
  }

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Aktueller Wert als JavaScript-Zahl */
  value: number | undefined | null;
  /** Callback wenn sich der Wert ändert */
  onChange: (value: number | undefined) => void;
  /** Anzahl Dezimalstellen (Standard: 2) */
  decimals?: number;
  /** Suffix nach dem Wert (z.B. "€" oder "km") */
  suffix?: string;
}

/**
 * Eingabefeld für Geldbeträge mit deutschem Zahlenformat.
 *
 * - Akzeptiert Komma als Dezimaltrennzeichen
 * - Formatiert automatisch mit Tausender-Trennzeichen beim Verlassen
 * - Gibt JavaScript-Zahlen zurück (für Zod/DB-Kompatibilität)
 *
 * @example
 * <CurrencyInput
 *   value={field.value}
 *   onChange={field.onChange}
 *   placeholder="0,00"
 *   suffix="€"
 * />
 */
export function CurrencyInput({
  value,
  onChange,
  decimals = 2,
  suffix,
  className,
  placeholder = '0,00',
  disabled,
  ...props
}: CurrencyInputProps): React.JSX.Element {
  // Interner State für die angezeigte Eingabe
  const [displayValue, setDisplayValue] = React.useState<string>('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Synchronisiere displayValue mit externem value wenn nicht fokussiert
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatGermanNumber(value ?? undefined, decimals));
    }
  }, [value, decimals, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const input = e.target.value;

    // Nur erlaubte Zeichen: Zahlen, Punkt, Komma
    const filtered = input.replace(/[^0-9.,\-]/g, '');
    setDisplayValue(filtered);

    // Sofort parsen und onChange aufrufen
    const parsed = parseGermanNumber(filtered);
    onChange(parsed);
  };

  const handleFocus = (): void => {
    setIsFocused(true);
    // Bei Fokus unformatiert anzeigen für einfacheres Bearbeiten
    if (value !== undefined && value !== null) {
      // Zeige mit Komma aber ohne Tausender-Trenner
      setDisplayValue(value.toFixed(decimals).replace('.', ','));
    }
  };

  const handleBlur = (): void => {
    setIsFocused(false);
    // Bei Blur formatieren
    const parsed = parseGermanNumber(displayValue);
    if (parsed !== undefined) {
      setDisplayValue(formatGermanNumber(parsed, decimals));
      onChange(parsed);
    } else {
      setDisplayValue('');
      onChange(undefined);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          suffix && 'pr-8',
          className
        )}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
