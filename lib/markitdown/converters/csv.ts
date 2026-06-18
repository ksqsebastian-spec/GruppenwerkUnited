import type { ConvertResult } from '../types';

/**
 * CSV → Markdown-Tabelle. Erkennt das Trennzeichen (Komma vs. Semikolon)
 * automatisch anhand der ersten Zeile und parst quotierte Felder korrekt.
 */
export function convertCsv(buffer: Buffer): ConvertResult {
  const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').trim();
  if (text.length === 0) {
    return { markdown: '', warnings: ['CSV ist leer.'] };
  }
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  if (rows.length === 0) return { markdown: '', warnings: ['Keine Zeilen in der CSV gefunden.'] };

  return { markdown: rowsToMarkdownTable(rows), warnings: [] };
}

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n', 1)[0] ?? '';
  const semis = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  if (tabs > semis && tabs > commas) return '\t';
  return semis > commas ? ';' : ',';
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  // letzte Zeile
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function rowsToMarkdownTable(rows: string[][]): string {
  if (rows.length === 0) return '';
  const cols = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => {
    const copy = [...r];
    while (copy.length < cols) copy.push('');
    return copy.map(escapeCell);
  });
  const header = padded[0];
  const body = padded.slice(1);
  const sep = new Array(cols).fill('---');
  let out = '| ' + header.join(' | ') + ' |\n';
  out += '| ' + sep.join(' | ') + ' |\n';
  for (const r of body) out += '| ' + r.join(' | ') + ' |\n';
  return out.trimEnd();
}

function escapeCell(v: string): string {
  return v.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
