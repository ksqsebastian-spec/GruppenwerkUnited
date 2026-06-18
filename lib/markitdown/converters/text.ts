import type { ConvertResult } from '../types';

/** Plain-Text / Markdown — kein Umbau nötig, nur dekodieren und CRLF normalisieren. */
export function convertText(buffer: Buffer): ConvertResult {
  const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').trim();
  return { markdown: text, warnings: [] };
}
