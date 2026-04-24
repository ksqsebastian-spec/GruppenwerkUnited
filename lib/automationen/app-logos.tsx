'use client';

import Image from 'next/image';
import { SiAnthropic, SiGooglesheets } from '@icons-pack/react-simple-icons';

/** Einheitliche Props für alle Logo-Komponenten */
export interface LogoProps {
  size?: number;
  className?: string;
}

export function GmailLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/gmail.png" width={size} height={size} alt="Gmail" />;
}

export function GdriveLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/google-drive.png" width={size} height={size} alt="Google Drive" />;
}

/** Offizielles Google-Sheets-Icon (nicht Excel) */
export function SheetsLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiGooglesheets size={size} color="#34A853" />;
}

export function ClaudeLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/claude.png" width={size} height={size} alt="Claude KI" />;
}

export function AnthropicLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiAnthropic size={size} color="#c96442" />;
}

export function OutlookLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/outlook.png" width={size} height={size} alt="Outlook" />;
}

export function WordLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/word.png" width={size} height={size} alt="Word" />;
}

export function PdfLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/pdf.png" width={size} height={size} alt="PDF" />;
}

export function ComposioLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/composio.png" width={size} height={size} alt="Composio" />;
}

export function GenericLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/composio.png" width={size} height={size} alt="Allgemein" />;
}
