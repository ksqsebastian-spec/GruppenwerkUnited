'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Token-Editor mit visuellen Chips statt {{…}}-Syntax.
 *
 * - Eingabe: ein contenteditable div mit zwei Knotenarten:
 *     • Text-Knoten (frei editierbar)
 *     • Chip-Knoten (non-editable Spans mit data-token)
 * - Chips werden über die Dropdowns oben eingefügt, am Cursor-Position;
 *   ein „×" am Chip entfernt ihn.
 * - Speicher-/Lade-Format ist das alte {{customer.feld}} / {{CODE}}-Format,
 *   damit das Server-Rendering kompatibel bleibt.
 *
 * React reicht das Dom-Element nur initial / bei externer value-Änderung
 * neu auf — während der Eingabe verwaltet sich das contenteditable-Div selbst,
 * damit der Cursor nicht springt.
 */

export interface TokenDef {
  /** Schlüssel im {{…}}-Format, z.B. "customer.firmenname" oder "MWST". */
  key: string;
  /** Anzeigetext im Chip, z.B. "Firmenname". */
  label: string;
  /** Optionale Hilfsinfo (z.B. aktueller Wert) im Dropdown-Eintrag. */
  hint?: string;
}

interface PromptTokenEditorProps {
  value: string;
  onChange: (next: string) => void;
  customerFields: TokenDef[];
  datenkodierungen: TokenDef[];
  placeholder?: string;
  rows?: number;
  id?: string;
}

// ── Helfer ───────────────────────────────────────────────────────────────────

function parseTemplate(value: string): Array<{ type: 'text'; value: string } | { type: 'token'; key: string }> {
  const out: Array<{ type: 'text'; value: string } | { type: 'token'; key: string }> = [];
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) out.push({ type: 'text', value: value.slice(last, m.index) });
    out.push({ type: 'token', key: m[1].trim() });
    last = re.lastIndex;
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out;
}

function labelFor(key: string, customerFields: TokenDef[], datenkodierungen: TokenDef[]): string {
  const lower = key.toLowerCase();
  if (lower.startsWith('customer.')) {
    return customerFields.find((c) => c.key.toLowerCase() === lower)?.label ?? lower.slice(9);
  }
  return datenkodierungen.find((d) => d.key.toUpperCase() === key.toUpperCase())?.label ?? key;
}

function buildChip(key: string, label: string, onRemove: (el: HTMLSpanElement) => void): HTMLSpanElement {
  const wrap = document.createElement('span');
  wrap.contentEditable = 'false';
  wrap.dataset.token = key;
  wrap.className =
    'mx-0.5 inline-flex select-none items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline text-xs font-medium text-primary';
  const text = document.createElement('span');
  text.textContent = label;
  wrap.appendChild(text);
  const del = document.createElement('button');
  del.type = 'button';
  del.tabIndex = -1;
  del.className = 'ml-0.5 cursor-pointer text-primary/70 hover:text-primary';
  del.textContent = '×';
  del.setAttribute('aria-label', `${label} entfernen`);
  del.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onRemove(wrap);
  });
  wrap.appendChild(del);
  return wrap;
}

function buildContent(
  div: HTMLDivElement,
  value: string,
  customerFields: TokenDef[],
  datenkodierungen: TokenDef[],
  onTokenRemoved: () => void,
): void {
  div.innerHTML = '';
  const segs = parseTemplate(value);
  for (const s of segs) {
    if (s.type === 'text') {
      // Text-Knoten direkt anhängen — Zeilenumbrüche bleiben dank white-space: pre-wrap erhalten
      if (s.value.length > 0) div.appendChild(document.createTextNode(s.value));
    } else {
      const chip = buildChip(s.key, labelFor(s.key, customerFields, datenkodierungen), (el) => {
        el.remove();
        onTokenRemoved();
      });
      div.appendChild(chip);
    }
  }
  // Editor braucht mindestens einen Text-Knoten am Ende, damit der Cursor dort platziert werden kann
  if (div.lastChild?.nodeType !== Node.TEXT_NODE) {
    div.appendChild(document.createTextNode(''));
  }
}

function serializeContent(div: HTMLDivElement): string {
  let out = '';
  div.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      out += n.textContent ?? '';
    } else if (n.nodeName === 'BR') {
      out += '\n';
    } else if (n instanceof HTMLElement && n.dataset.token) {
      out += `{{${n.dataset.token}}}`;
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      // Falls Browser <div> für Zeilenumbruch einfügt
      if (out.length > 0 && !out.endsWith('\n')) out += '\n';
      out += serializeContent(n as HTMLDivElement);
    }
  });
  return out;
}

function insertAtCursor(div: HTMLDivElement, node: Node): void {
  const sel = window.getSelection();
  let range: Range;
  if (sel && sel.rangeCount > 0 && div.contains(sel.anchorNode)) {
    range = sel.getRangeAt(0);
    range.deleteContents();
  } else {
    range = document.createRange();
    range.selectNodeContents(div);
    range.collapse(false);
  }
  range.insertNode(node);
  // Cursor hinter den eingefügten Knoten + ein Leerzeichen
  const spacer = document.createTextNode(' ');
  node.parentNode?.insertBefore(spacer, node.nextSibling);
  const newRange = document.createRange();
  newRange.setStartAfter(spacer);
  newRange.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(newRange);
}

// ── Komponente ───────────────────────────────────────────────────────────────

export function PromptTokenEditor({
  value,
  onChange,
  customerFields,
  datenkodierungen,
  placeholder,
  rows = 12,
  id,
}: PromptTokenEditorProps): React.JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  // Verhindert, dass externe value-Änderungen während des Tippens den Inhalt überschreiben
  const lastEmittedRef = useRef<string>('');
  const initializedRef = useRef(false);

  const handleSerializeAndEmit = (): void => {
    const div = editorRef.current;
    if (!div) return;
    const next = serializeContent(div);
    lastEmittedRef.current = next;
    onChange(next);
  };

  // Initial-Aufbau und externes Setzen
  useEffect(() => {
    const div = editorRef.current;
    if (!div) return;
    // Beim ersten Mount immer aufbauen; danach nur, wenn die Änderung NICHT aus dem Editor selbst stammt
    if (initializedRef.current && value === lastEmittedRef.current) return;
    buildContent(div, value, customerFields, datenkodierungen, handleSerializeAndEmit);
    lastEmittedRef.current = value;
    initializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, customerFields, datenkodierungen]);

  const handleInput = (): void => {
    handleSerializeAndEmit();
  };

  // Reiner Text einfügen — verhindert formatierten Paste-Inhalt
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    handleSerializeAndEmit();
  };

  const handleInsertToken = (def: TokenDef): void => {
    const div = editorRef.current;
    if (!div) return;
    // Damit das Einfügen am Cursor klappt, muss der Editor fokussiert sein
    if (document.activeElement !== div) div.focus();
    const chip = buildChip(def.key, def.label, (el) => {
      el.remove();
      handleSerializeAndEmit();
    });
    insertAtCursor(div, chip);
    handleSerializeAndEmit();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Felder einfügen:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" /> Kundendaten <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Kundenfeld einfügen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {customerFields.map((f) => (
              <DropdownMenuItem key={f.key} onSelect={() => handleInsertToken(f)}>
                {f.label}
                {f.hint && <span className="ml-2 text-xs text-muted-foreground">{f.hint}</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={datenkodierungen.length === 0}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Eigene Daten <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Datenkodierung einfügen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {datenkodierungen.length === 0 ? (
              <DropdownMenuItem disabled>Keine Einträge vorhanden</DropdownMenuItem>
            ) : (
              datenkodierungen.map((f) => (
                <DropdownMenuItem key={f.key} onSelect={() => handleInsertToken(f)}>
                  {f.label}
                  {f.hint && <span className="ml-2 text-xs text-muted-foreground">{f.hint}</span>}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        ref={editorRef}
        id={id}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[200px] w-full whitespace-pre-wrap rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
        )}
        style={{ minHeight: `${rows * 1.5}rem` }}
      />
      <p className="text-xs text-muted-foreground">
        Tippe den Anweisungs-Text und füge über die Buttons oben Felder als bunte Chips ein.
        Beim Generieren werden die Chips durch die echten Kundendaten ersetzt.
      </p>
    </div>
  );
}
