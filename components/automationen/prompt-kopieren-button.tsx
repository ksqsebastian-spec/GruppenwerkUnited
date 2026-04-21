'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptKopierenButtonProps {
  /** Der zu kopierende Prompt-Text */
  promptText: string;
  /** Zeigt Datenkodierungs-Badge wenn true */
  usesDatenkodierung?: boolean;
  className?: string;
}

/**
 * Kopier-Button für Automatisierungs-Prompts.
 * Wechselt für 2 Sekunden zum Häkchen-Icon nach erfolgreichem Kopieren.
 */
export function PromptKopierenButton({
  promptText,
  usesDatenkodierung = false,
  className,
}: PromptKopierenButtonProps): React.JSX.Element {
  const [kopiert, setKopiert] = useState(false);

  const handleKopieren = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = promptText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        className={cn(
          'h-7 gap-1.5 text-xs font-medium transition-all',
          kopiert && 'border-green-300 text-green-700 bg-green-50 hover:bg-green-50',
          className
        )}
        onClick={handleKopieren}
        title="Prompt für Claude kopieren"
      >
        {kopiert ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {kopiert ? 'Kopiert!' : 'Prompt kopieren'}
      </Button>

      {usesDatenkodierung && (
        <Badge
          variant="outline"
          className="h-6 text-[10px] px-1.5 border-[#c96442]/30 text-[#c96442] bg-[#c96442]/5"
          title="Dieser Prompt referenziert pseudonymisierte Daten (Datenkodierung)"
        >
          Datenkodierung
        </Badge>
      )}
    </div>
  );
}
