/** Ergebnis einer Datei→Markdown-Konvertierung. */
export interface ConvertResult {
  markdown: string;
  warnings: string[];
}
