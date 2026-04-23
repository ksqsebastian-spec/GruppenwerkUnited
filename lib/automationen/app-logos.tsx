'use client';

import Image from 'next/image';
import { SiGooglesheets, SiAnthropic } from '@icons-pack/react-simple-icons';

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
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#2B579A" />
      <path d="M30 4l10 10H30V4z" fill="#1D3F7A" />
      <path d="M13 20l4 16 5-11 5 11 4-16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function PdfLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#EA4335" />
      <path d="M30 4l10 10H30V4z" fill="#C5221F" />
      <text x="24" y="35" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    </svg>
  );
}

export function GenericLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <Image src="/logos/composio.png" width={size} height={size} alt="Allgemein" />;
}
