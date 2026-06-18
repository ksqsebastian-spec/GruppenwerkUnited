import type { ConvertResult } from '../types';

/**
 * PDF → Text via `unpdf`. unpdf ist eine Next.js-/serverless-freundliche
 * Variante von pdfjs ohne native Abhängigkeiten und ohne Standard-Font-Loader,
 * die in normalen Node-Containern oft scheitern.
 *
 * Wir extrahieren reinen Text pro Seite (mergePages: false). Seitenumbrüche
 * werden als horizontale Trenner ausgegeben.
 */
export async function convertPdf(buffer: Buffer): Promise<ConvertResult> {
  try {
    const { extractText } = await import('unpdf');
    const data = new Uint8Array(buffer);
    const result = await extractText(data, { mergePages: false });

    const pages = Array.isArray(result.text) ? result.text : [result.text];
    const cleaned = pages
      .map((p) => cleanupPageText(p ?? ''))
      .filter((p) => p.length > 0);

    const markdown = cleaned.join('\n\n---\n\n').trim();
    const warnings: string[] = [];
    if (markdown.length === 0) {
      warnings.push(
        'Kein Text gefunden — die PDF besteht möglicherweise aus eingescannten Bildern (OCR wird in dieser Version nicht unterstützt).',
      );
    }
    return { markdown, warnings };
  } catch (err) {
    return {
      markdown: '',
      warnings: [
        `PDF konnte nicht gelesen werden: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`,
      ],
    };
  }
}

function cleanupPageText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
