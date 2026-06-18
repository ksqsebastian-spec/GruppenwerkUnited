import TurndownService from 'turndown';
import type { ConvertResult } from '../types';

let cached: TurndownService | null = null;

/** Konfiguriert eine TurndownService-Instanz mit GitHub-ähnlichen Defaults. */
export function getTurndown(): TurndownService {
  if (cached) return cached;
  const t = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });
  // Whitespace strippen und einfache Tabellen erhalten (turndown unterstützt
  // Tabellen nicht out-of-the-box; wir nutzen ein simples Plugin von Hand)
  t.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => `~~${content}~~`,
  });
  t.addRule('table', {
    filter: 'table',
    replacement: (_content, node) => htmlTableToMarkdown(node as HTMLTableElement),
  });
  cached = t;
  return t;
}

/**
 * HTML → Markdown via turndown. Sehr robust für DOCX-Output von mammoth und
 * normales Web-HTML.
 */
export function convertHtml(buffer: Buffer): ConvertResult {
  const html = buffer.toString('utf-8');
  return { markdown: getTurndown().turndown(html).trim(), warnings: [] };
}

function htmlTableToMarkdown(table: HTMLTableElement): string {
  const rows: string[][] = [];
  for (const tr of Array.from(table.querySelectorAll('tr'))) {
    const cells: string[] = [];
    for (const td of Array.from(tr.querySelectorAll('th,td'))) {
      cells.push((td.textContent ?? '').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|'));
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return '';
  const cols = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => {
    const c = [...r];
    while (c.length < cols) c.push('');
    return c;
  });
  const sep = new Array(cols).fill('---');
  const lines: string[] = [];
  lines.push('| ' + padded[0].join(' | ') + ' |');
  lines.push('| ' + sep.join(' | ') + ' |');
  for (const r of padded.slice(1)) lines.push('| ' + r.join(' | ') + ' |');
  return '\n\n' + lines.join('\n') + '\n\n';
}
