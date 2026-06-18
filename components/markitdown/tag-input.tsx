'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { normalizeTag } from '@/lib/validations/markitdown';

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Bekannte Tags aus der DB — werden als Vorschläge angezeigt. */
  suggestions?: string[];
  placeholder?: string;
  id?: string;
}

/**
 * Tag-Eingabe mit Chip-Anzeige. Enter, Komma oder Leertaste bestätigt einen
 * Tag; Backspace im leeren Feld entfernt den letzten Chip. Vorschläge aus
 * vorhandenen Tags werden gefiltert unter dem Feld angeboten.
 */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Tag tippen + Enter',
  id,
}: TagInputProps): React.JSX.Element {
  const [input, setInput] = useState('');

  const vorschlaege = useMemo(() => {
    const q = input.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => (q.length === 0 ? true : s.includes(q)))
      .slice(0, 8);
  }, [suggestions, value, input]);

  const addTag = (raw: string): void => {
    const t = normalizeTag(raw);
    if (t.length === 0) return;
    if (value.includes(t)) {
      setInput('');
      return;
    }
    onChange([...value, t]);
    setInput('');
  };

  const removeTag = (tag: string): void => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',' || (e.key === ' ' && input.length > 0)) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input.length === 0 && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {value.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1">
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="rounded-sm hover:bg-muted-foreground/20"
                aria-label={`${t} entfernen`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim().length > 0 && addTag(input)}
        placeholder={placeholder}
      />
      {vorschlaege.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {vorschlaege.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
