import {
  FolderOpen,
  Mail,
  Table2,
  FileText,
  Bot,
  FileType2,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AutomatisierungAppTyp } from '@/types';

/** Visuelle Konfiguration für einen App-Typ */
export interface AppTypKonfiguration {
  /** Akzentfarbe (HEX) */
  farbe: string;
  /** Helle Hintergrundfarbe für Icons und Badges (HEX) */
  helleFarbe: string;
  /** Lucide-Icon-Komponente */
  Icon: LucideIcon;
  /** Lesbarer Name (Deutsch) */
  bezeichnung: string;
}

/**
 * Zuordnung von App-Typ zu visueller Konfiguration.
 * claude/ai verwenden Terrakotta (Werkbank-Markenfarbe).
 */
export const APP_TYPEN: Record<AutomatisierungAppTyp, AppTypKonfiguration> = {
  gdrive: {
    farbe: '#10B981',
    helleFarbe: '#ecfdf5',
    Icon: FolderOpen,
    bezeichnung: 'Google Drive',
  },
  outlook: {
    farbe: '#0078D4',
    helleFarbe: '#eff6ff',
    Icon: Mail,
    bezeichnung: 'Outlook',
  },
  email: {
    farbe: '#0078D4',
    helleFarbe: '#eff6ff',
    Icon: Mail,
    bezeichnung: 'E-Mail',
  },
  sheets: {
    farbe: '#34A853',
    helleFarbe: '#f0fdf4',
    Icon: Table2,
    bezeichnung: 'Google Sheets',
  },
  word: {
    farbe: '#2B579A',
    helleFarbe: '#eff6ff',
    Icon: FileText,
    bezeichnung: 'Word',
  },
  claude: {
    farbe: '#c96442',
    helleFarbe: '#fdf5f2',
    Icon: Bot,
    bezeichnung: 'Claude KI',
  },
  ai: {
    farbe: '#c96442',
    helleFarbe: '#fdf5f2',
    Icon: Bot,
    bezeichnung: 'KI',
  },
  pdf: {
    farbe: '#EA4335',
    helleFarbe: '#fef2f2',
    Icon: FileType2,
    bezeichnung: 'PDF',
  },
  generic: {
    farbe: '#87867f',
    helleFarbe: '#f5f5f4',
    Icon: Workflow,
    bezeichnung: 'Allgemein',
  },
};

/** Gibt die Konfiguration für einen App-Typ zurück, Fallback auf 'generic' */
export function getAppTypKonfiguration(typ: string): AppTypKonfiguration {
  return APP_TYPEN[typ as AutomatisierungAppTyp] ?? APP_TYPEN.generic;
}
