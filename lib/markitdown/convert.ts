import type { ConvertResult } from './types';
import { convertText } from './converters/text';
import { convertJson } from './converters/json';
import { convertXml } from './converters/xml';
import { convertCsv } from './converters/csv';
import { convertXlsx } from './converters/xlsx';
import { convertHtml } from './converters/html';
import { convertDocx } from './converters/docx';
import { convertPdf } from './converters/pdf';

/**
 * Erkannte Dateierweiterungen → Lookup. Wird auch vom Upload-API-Handler
 * genutzt, um eine Datei vor dem Konvertieren zu validieren.
 */
export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.csv',
  '.html',
  '.htm',
  '.json',
  '.xml',
  '.md',
  '.markdown',
  '.txt',
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/** Liefert die Erweiterung (mit Punkt, kleinbuchstabig) oder leeren String. */
export function extOf(filename: string): string {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

/**
 * Dispatch: anhand der Datei-Endung wählen wir den passenden Konverter.
 * Unbekannte Endungen werden als Plain Text behandelt — das verhindert ein
 * hartes Scheitern bei Dateien ohne Suffix oder mit ungewöhnlicher Extension.
 */
export async function convertToMarkdown(file: File): Promise<ConvertResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extOf(file.name);
  switch (ext) {
    case '.pdf':
      return convertPdf(buffer);
    case '.docx':
    case '.doc':
      return convertDocx(buffer);
    case '.xlsx':
    case '.xls':
      return convertXlsx(buffer);
    case '.csv':
      return convertCsv(buffer);
    case '.html':
    case '.htm':
      return convertHtml(buffer);
    case '.json':
      return convertJson(buffer);
    case '.xml':
      return convertXml(buffer);
    case '.md':
    case '.markdown':
    case '.txt':
    default:
      return convertText(buffer);
  }
}
