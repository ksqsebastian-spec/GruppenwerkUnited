import type { AutomatisierungAppTyp } from '@/types';
import type { LogoProps } from './app-logos';
import {
  GmailLogo,
  GdriveLogo,
  OutlookLogo,
  ClaudeLogo,
  SheetsLogo,
  GenericLogo,
  WordLogo,
  PdfLogo,
} from './app-logos';

/** Visuelle Konfiguration für einen App-Typ */
export interface AppTypKonfiguration {
  /** Akzentfarbe (HEX) */
  farbe: string;
  /** Helle Hintergrundfarbe für Icon-Hintergrund und Badges */
  helleFarbe: string;
  /** Logo-Komponente mit offiziellem App-Logo */
  Logo: React.ComponentType<LogoProps>;
  /** Lesbarer Name (Deutsch) */
  bezeichnung: string;
}

export const APP_TYPEN: Record<AutomatisierungAppTyp, AppTypKonfiguration> = {
  gdrive: {
    farbe: '#4285F4',
    helleFarbe: '#eff6ff',
    Logo: GdriveLogo,
    bezeichnung: 'Google Drive',
  },
  outlook: {
    farbe: '#0078D4',
    helleFarbe: '#eff6ff',
    Logo: OutlookLogo,
    bezeichnung: 'Outlook',
  },
  email: {
    farbe: '#EA4335',
    helleFarbe: '#fef2f2',
    Logo: GmailLogo,
    bezeichnung: 'E-Mail',
  },
  sheets: {
    farbe: '#34A853',
    helleFarbe: '#f0fdf4',
    Logo: SheetsLogo,
    bezeichnung: 'Google Sheets',
  },
  word: {
    farbe: '#2B579A',
    helleFarbe: '#eff6ff',
    Logo: WordLogo,
    bezeichnung: 'Word',
  },
  claude: {
    farbe: '#D97757',
    helleFarbe: '#fdf5f2',
    Logo: ClaudeLogo,
    bezeichnung: 'Claude KI',
  },
  ai: {
    farbe: '#D97757',
    helleFarbe: '#fdf5f2',
    Logo: ClaudeLogo,
    bezeichnung: 'KI',
  },
  pdf: {
    farbe: '#EA4335',
    helleFarbe: '#fef2f2',
    Logo: PdfLogo,
    bezeichnung: 'PDF',
  },
  generic: {
    farbe: '#87867f',
    helleFarbe: '#f5f5f4',
    Logo: GenericLogo,
    bezeichnung: 'Allgemein',
  },
};

/** Gibt die Konfiguration für einen App-Typ zurück, Fallback auf 'generic' */
export function getAppTypKonfiguration(typ: string): AppTypKonfiguration {
  return APP_TYPEN[typ as AutomatisierungAppTyp] ?? APP_TYPEN.generic;
}
