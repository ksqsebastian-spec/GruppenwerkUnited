'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ConsultingInlineEditProps {
  value: string | null;
  placeholder: string;
  onSave: (value: string | null) => void;
  type?: 'text' | 'number';
  className?: string;
}

export function ConsultingInlineEdit({
  value,
  placeholder,
  onSave,
  type = 'text',
  className,
}: ConsultingInlineEditProps): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    const next = trimmed === '' ? null : trimmed;
    if (next !== value) {
      onSave(next);
    }
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setDraft(value ?? '');
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-5 rounded border border-[#e5e5e5] bg-white px-1.5 text-[11px] text-[#000000] focus:outline-none focus:border-[#000000] w-full',
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value ?? '');
        setEditing(true);
      }}
      className={cn(
        'text-[11px] text-left truncate',
        value ? 'text-[#404040]' : 'text-[#c0c0c0] italic',
        'hover:text-[#000000] cursor-text focus:outline-none',
        className
      )}
    >
      {type === 'number' && value
        ? `${Number(value).toLocaleString('de-DE')} €`
        : value ?? placeholder}
    </button>
  );
}
