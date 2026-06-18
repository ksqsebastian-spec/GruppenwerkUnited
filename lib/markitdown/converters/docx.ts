import mammoth from 'mammoth';
import type { ConvertResult } from '../types';
import { getTurndown } from './html';

/**
 * DOCX → Markdown: mammoth wandelt das Office-XML in semantisches HTML
 * (Überschriften, Listen, Tabellen). Das HTML wird dann an turndown weiter-
 * gereicht. Mammoth-Warnungen (z.B. „kein Style-Mapping") werden weitergegeben.
 */
export async function convertDocx(buffer: Buffer): Promise<ConvertResult> {
  try {
    const result = await mammoth.convertToHtml({ buffer });
    const markdown = getTurndown().turndown(result.value).trim();
    const warnings = result.messages
      .filter((m) => m.type === 'warning' || m.type === 'error')
      .map((m) => m.message)
      .slice(0, 10);
    return { markdown, warnings };
  } catch (err) {
    return {
      markdown: '',
      warnings: [`DOCX konnte nicht gelesen werden: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`],
    };
  }
}
