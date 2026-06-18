import { XMLParser } from 'fast-xml-parser';
import type { ConvertResult } from '../types';

/**
 * XML: parsen und als verschachtelte Markdown-Liste ausgeben. Attribute
 * werden als kursive Inline-Annotationen am Knoten dargestellt.
 */
export function convertXml(buffer: Buffer): ConvertResult {
  const raw = buffer.toString('utf-8');
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      preserveOrder: false,
      trimValues: true,
    });
    const tree = parser.parse(raw) as Record<string, unknown>;
    return { markdown: renderNode(tree).trim(), warnings: [] };
  } catch {
    return {
      markdown: '```xml\n' + raw.trim() + '\n```',
      warnings: ['XML konnte nicht geparst werden — als Roh-Codeblock eingebettet.'],
    };
  }
}

function renderNode(value: unknown, depth = 0): string {
  const indent = '  '.repeat(depth);
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return `${indent}- ${String(value)}\n`;

  let out = '';
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('@')) continue; // Attribute werden inline am Eltern-Knoten gerendert
    if (Array.isArray(val)) {
      for (const item of val) {
        out += `${indent}- **${key}**${formatAttrs(item)}\n${renderNode(item, depth + 1)}`;
      }
    } else if (val !== null && typeof val === 'object') {
      out += `${indent}- **${key}**${formatAttrs(val)}\n${renderNode(val, depth + 1)}`;
    } else {
      out += `${indent}- **${key}**: ${String(val)}\n`;
    }
  }
  return out;
}

function formatAttrs(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const attrs: string[] = [];
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k.startsWith('@')) attrs.push(`${k.slice(1)}="${String(v)}"`);
  }
  return attrs.length > 0 ? ` *(${attrs.join(', ')})*` : '';
}
