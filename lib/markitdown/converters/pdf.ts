import type { ConvertResult } from '../types';

/**
 * PDF → Text. Wir nutzen den pdfjs-dist-Legacy-Build, der ohne Browser-/Worker-
 * Abhängigkeiten in Node läuft. Die Text-Items werden pro Seite zusammen-
 * geführt; Seitenumbrüche werden als horizontale Trenner ausgegeben.
 */
export async function convertPdf(buffer: Buffer): Promise<ConvertResult> {
  // dynamischer Import — pdfjs-dist soll nur dann geladen werden, wenn es
  // wirklich gebraucht wird (spart Boot-Zeit der API-Routen für andere Formate)
  type PdfModule = {
    getDocument: (opts: { data: Uint8Array; useSystemFonts?: boolean }) => {
      promise: Promise<PdfDocument>;
    };
  };
  type PdfDocument = {
    numPages: number;
    getPage: (n: number) => Promise<PdfPage>;
  };
  type PdfPage = {
    getTextContent: () => Promise<{ items: Array<TextItem | unknown> }>;
  };
  type TextItem = { str: string; hasEOL?: boolean };

  let pdfjs: PdfModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs = mod as PdfModule;
  } catch (err) {
    return {
      markdown: '',
      warnings: [
        `PDF-Parser konnte nicht geladen werden: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`,
      ],
    };
  }

  try {
    const uint = new Uint8Array(buffer);
    const doc = await pdfjs.getDocument({ data: uint, useSystemFonts: true }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let pageText = '';
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        if (typeof item.str !== 'string') continue;
        pageText += item.str;
        if (item.hasEOL) pageText += '\n';
        else pageText += ' ';
      }
      pages.push(cleanupPageText(pageText));
    }
    const md = pages.join('\n\n---\n\n').trim();
    const warnings: string[] = [];
    if (md.length === 0) {
      warnings.push(
        'Kein Text gefunden — die PDF besteht möglicherweise aus eingescannten Bildern (OCR wird in dieser Version nicht unterstützt).',
      );
    }
    return { markdown: md, warnings };
  } catch (err) {
    return {
      markdown: '',
      warnings: [`PDF konnte nicht gelesen werden: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`],
    };
  }
}

function cleanupPageText(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
