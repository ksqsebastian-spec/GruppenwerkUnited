'use client';

import Link from 'next/link';
import { File as FileIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDateiVorlagen } from '@/hooks/use-kunden';

interface DateiVorlageSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  className?: string;
}

/**
 * Dropdown zur Auswahl einer Datei-Vorlage aus der Bibliothek (oder „keine").
 * Wird im Prompt-Bearbeiten-Dialog und (mit eigenem Wrapper) im Runner als
 * Datei-Override genutzt.
 */
export function DateiVorlageSelect({
  value,
  onChange,
  label = 'Datei-Vorlage',
  className,
}: DateiVorlageSelectProps): React.JSX.Element {
  const { data: vorlagen = [], isLoading } = useDateiVorlagen();

  return (
    <div className={className}>
      {label && (
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      )}
      <Select value={value ?? '__none__'} onValueChange={(v) => onChange(v === '__none__' ? null : v)}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Lädt…' : 'Keine Datei'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Keine Datei —</SelectItem>
          {vorlagen.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              <span className="flex items-center gap-2">
                <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {v.kategorie ? `${v.kategorie} — ${v.name}` : v.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!isLoading && vorlagen.length === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Noch keine Datei-Vorlagen.{' '}
          <Link href="/kunden/prompts?tab=dateien" className="underline">
            Bibliothek füllen
          </Link>
        </p>
      )}
    </div>
  );
}
