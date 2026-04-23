'use client';

import {
  SiGmail,
  SiGoogledrive,
  SiGooglesheets,
  SiClaude,
  SiAnthropic,
} from '@icons-pack/react-simple-icons';

/** Einheitliche Props für alle Logo-Komponenten */
export interface LogoProps {
  size?: number;
  className?: string;
}

/** Gmail – offizielles Simple-Icons-Logo */
export function GmailLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiGmail size={size} color="#EA4335" />;
}

/** Google Drive – offizielles Simple-Icons-Logo */
export function GdriveLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiGoogledrive size={size} color="#4285F4" />;
}

/** Google Sheets – offizielles Simple-Icons-Logo */
export function SheetsLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiGooglesheets size={size} color="#34A853" />;
}

/** Claude KI – offizielles Claude-Logo */
export function ClaudeLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiClaude size={size} color="#D97757" />;
}

/** Anthropic-Logo (Alias für Claude) */
export function AnthropicLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return <SiAnthropic size={size} color="#c96442" />;
}

/** Outlook – eigenes SVG (nicht in simple-icons) */
export function OutlookLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="44" height="44" rx="6" fill="#0078D4" />
      <rect x="8" y="15" width="32" height="20" rx="2" fill="none" stroke="white" strokeWidth="1.8" />
      <path d="M8 17.5L24 27L40 17.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="29" r="4.5" fill="white" />
      <circle cx="16" cy="29" r="2" fill="#0078D4" />
    </svg>
  );
}

/** Word / Dokument – eigenes SVG */
export function WordLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#2B579A" />
      <path d="M30 4l10 10H30V4z" fill="#1D3F7A" />
      <path d="M13 20l4 16 5-11 5 11 4-16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** PDF – eigenes SVG */
export function PdfLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#EA4335" />
      <path d="M30 4l10 10H30V4z" fill="#C5221F" />
      <text x="24" y="35" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    </svg>
  );
}

/** Generisches Workflow-Logo – gestapelte Balken (n8n-inspiriert) */
export function GenericLogo({ size = 40 }: LogoProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="10" width="40" height="8" rx="2" fill="#87867f" />
      <rect x="4" y="22" width="28" height="8" rx="2" fill="#87867f" fillOpacity="0.75" />
      <rect x="4" y="34" width="18" height="8" rx="2" fill="#87867f" fillOpacity="0.5" />
    </svg>
  );
}
