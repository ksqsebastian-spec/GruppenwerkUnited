import type { ConvertResult } from '../types';

/**
 * JSON: hübsch formatiert in einem Markdown-Codeblock. Bei ungültigem JSON
 * bleibt der Rohtext erhalten und es gibt eine Warnung.
 */
export function convertJson(buffer: Buffer): ConvertResult {
  const raw = buffer.toString('utf-8');
  try {
    const parsed = JSON.parse(raw) as unknown;
    return {
      markdown: '```json\n' + JSON.stringify(parsed, null, 2) + '\n```',
      warnings: [],
    };
  } catch {
    return {
      markdown: '```\n' + raw.trim() + '\n```',
      warnings: ['Datei konnte nicht als JSON geparst werden — als Roh-Codeblock eingebettet.'],
    };
  }
}
