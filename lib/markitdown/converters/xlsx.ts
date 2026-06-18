import * as XLSX from 'xlsx';
import type { ConvertResult } from '../types';
import { rowsToMarkdownTable } from './csv';

/**
 * XLSX/XLS → Markdown: jedes Tabellenblatt wird als eigene Überschrift mit
 * darunterliegender Markdown-Tabelle ausgegeben. Komplett leere Sheets werden
 * übersprungen.
 */
export function convertXlsx(buffer: Buffer): ConvertResult {
  const warnings: string[] = [];
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    return {
      markdown: '',
      warnings: [`Tabelle konnte nicht gelesen werden: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`],
    };
  }

  const sections: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
    }) as unknown[][];

    const cleaned = rows
      .map((row) => row.map((cell) => (cell == null ? '' : String(cell))))
      .filter((row) => row.some((cell) => cell.trim().length > 0));

    if (cleaned.length === 0) {
      warnings.push(`Blatt "${sheetName}" ist leer.`);
      continue;
    }
    sections.push(`## ${sheetName}\n\n${rowsToMarkdownTable(cleaned)}`);
  }

  return { markdown: sections.join('\n\n'), warnings };
}
