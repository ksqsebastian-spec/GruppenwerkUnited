'use client';

/** Basis-Props für alle Logo-Komponenten */
interface LogoProps {
  className?: string;
}

/** Gmail-Logo: Bunter Briefumschlag */
export function GmailLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Envelope body */}
      <path d="M6 9h36a3 3 0 013 3v24a3 3 0 01-3 3H6a3 3 0 01-3-3V12a3 3 0 013-3z" fill="white"/>
      {/* Left red triangle (fold) */}
      <path d="M3 12L3 38L18 24Z" fill="#EA4335"/>
      {/* Right blue triangle (fold) */}
      <path d="M45 12L45 38L30 24Z" fill="#4285F4"/>
      {/* Top red trapezoid (flap) */}
      <path d="M3 12L24 27L45 12L45 9L6 9A3 3 0 003 12Z" fill="#EA4335"/>
      {/* White M highlight */}
      <path d="M3 12L24 27L45 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      {/* Bottom section */}
      <path d="M18 24L3 38h42L30 24L24 29Z" fill="white"/>
      {/* Envelope border */}
      <path d="M6 9h36a3 3 0 013 3v24a3 3 0 01-3 3H6a3 3 0 01-3-3V12a3 3 0 013-3z" stroke="#E0E0E0" strokeWidth="1" fill="none"/>
    </svg>
  );
}

/** Google Drive-Logo: Dreifarbiges Dreieck */
export function GdriveLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Green bottom section */}
      <path d="M4 44L14 24L24 31L24 44Z" fill="#34A853"/>
      {/* Blue right section */}
      <path d="M44 44L34 24L24 31L24 44Z" fill="#4285F4"/>
      {/* Yellow/orange top section */}
      <path d="M24 4L14 24L24 31L34 24Z" fill="#FBBC04"/>
      {/* Shared bottom strip */}
      <path d="M14 24L4 44H44L34 24L24 31Z" fill="none"/>
      {/* Inner highlight lines */}
      <path d="M14 24L24 31L34 24" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M24 31L24 44" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

/** Outlook-Logo: Blauer Briefumschlag mit O */
export function OutlookLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blue background */}
      <rect x="2" y="2" width="44" height="44" rx="6" fill="#0078D4"/>
      {/* White envelope shape */}
      <rect x="8" y="14" width="32" height="22" rx="2" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
      {/* White M fold */}
      <path d="M8 16L24 26L40 16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* O letter */}
      <circle cx="16" cy="28" r="5" fill="white"/>
      <circle cx="16" cy="28" r="2.5" fill="#0078D4"/>
    </svg>
  );
}

/** Claude/Anthropic-Logo: Oranges Asterisk-Sternchen */
export function ClaudeLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#c96442" strokeWidth="4" strokeLinecap="round">
        {/* 6 Linien bei 0°, 30°, 60°, 90°, 120°, 150° */}
        <line x1="24" y1="6" x2="24" y2="42"/>
        <line x1="6" y1="33" x2="42" y2="15"/>
        <line x1="6" y1="15" x2="42" y2="33"/>
      </g>
    </svg>
  );
}

/** Google Sheets-Logo: Grünes Raster-Dokument */
export function SheetsLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="36" height="40" rx="3" fill="#34A853"/>
      <rect x="6" y="4" width="24" height="40" rx="3" fill="#2D9144"/>
      {/* Grid lines */}
      <line x1="6" y1="17" x2="42" y2="17" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
      <line x1="6" y1="27" x2="42" y2="27" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
      <line x1="6" y1="37" x2="42" y2="37" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
      <line x1="22" y1="4" x2="22" y2="44" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
    </svg>
  );
}

/** Generisches Workflow-Logo: Gestapelte Balken (n8n-inspiriert) */
export function GenericLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="40" height="8" rx="2" fill="#87867f"/>
      <rect x="4" y="22" width="28" height="8" rx="2" fill="#87867f" fillOpacity="0.75"/>
      <rect x="4" y="34" width="18" height="8" rx="2" fill="#87867f" fillOpacity="0.5"/>
    </svg>
  );
}

/** Word / Dokument-Logo: Blaues Dokument */
export function WordLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#2B579A"/>
      <path d="M30 4l10 10H30V4z" fill="#1E3F7A"/>
      {/* W letter */}
      <path d="M14 20l3 14 4-9 4 9 3-14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/** PDF-Logo: Rotes Dokument */
export function PdfLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#EA4335"/>
      <path d="M30 4l10 10H30V4z" fill="#C5221F"/>
      {/* PDF text */}
      <text x="24" y="34" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    </svg>
  );
}
