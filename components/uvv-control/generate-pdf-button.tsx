'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateUvvInstructionPdf } from '@/lib/pdf/uvv-instruction';
import { useUvvSettings } from '@/hooks/use-uvv-control';
import { toast } from 'sonner';
import type { Driver } from '@/types';

interface GeneratePdfButtonProps {
  /** Fahrer für den das PDF erstellt wird */
  driver: Driver;
  /** Optionale zusätzliche Themen */
  additionalTopics?: string;
  /** Button-Variante */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button-Größe */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

/**
 * Button zum Generieren eines UVV-Unterweisungs-PDFs
 */
export function GeneratePdfButton({
  driver,
  additionalTopics,
  variant = 'outline',
  size = 'default',
  className,
}: GeneratePdfButtonProps): React.JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: settings } = useUvvSettings();

  const handleGeneratePdf = async (): Promise<void> => {
    if (!settings) {
      toast.error('Einstellungen konnten nicht geladen werden');
      return;
    }

    setIsGenerating(true);

    try {
      generateUvvInstructionPdf({
        driver,
        settings,
        additionalTopics,
      });
      toast.success('PDF wurde erstellt und heruntergeladen');
    } catch (error) {
      console.error('Fehler beim Erstellen des PDFs:', error);
      toast.error('PDF konnte nicht erstellt werden');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleGeneratePdf}
      disabled={isGenerating || !settings}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Wird erstellt...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          PDF erstellen
        </>
      )}
    </Button>
  );
}
