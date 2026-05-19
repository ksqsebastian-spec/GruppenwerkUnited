'use client';

import Image from 'next/image';
import { Check, Clipboard, Copy, ScanSearch, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BausteinKarte } from './datei-browser-baustein-karte';
import type { AusgabeFormat, Baustein } from './datei-browser-helpers';

interface PromptBuilderProps {
  bausteine: Baustein[];
  mitComposio: boolean;
  ausgabeFormat: AusgabeFormat;
  aufgabe: string;
  kopiert: boolean;
  onToggleComposio: () => void;
  onBausteineLeeren: () => void;
  onBausteinEntfernen: (id: string) => void;
  onAusgabeFormatToggle: (format: NonNullable<AusgabeFormat>) => void;
  onAufgabeChange: (text: string) => void;
  onKopieren: () => void;
}

export function PromptBuilder({
  bausteine,
  mitComposio,
  ausgabeFormat,
  aufgabe,
  kopiert,
  onToggleComposio,
  onBausteineLeeren,
  onBausteinEntfernen,
  onAusgabeFormatToggle,
  onAufgabeChange,
  onKopieren,
}: PromptBuilderProps): React.JSX.Element {
  return (
    <div className="shrink-0 w-80 flex flex-col border-l border-[#e5e5e5] bg-[#fafafa]">
      {/* 1+2 · KI & Connector */}
      <div className="shrink-0 px-3 py-2 border-b border-[#e5e5e5] flex items-center gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <Image src="/logos/claude.png" width={16} height={16} alt="Claude" className="object-contain" />
          <span className="text-[11px] font-semibold text-[#000000]">Claude</span>
        </div>
        <span className="text-[#d4d4d4] text-[10px]">·</span>
        <button
          onClick={onToggleComposio}
          title={
            mitComposio
              ? 'Composio ermöglicht Umbenennen, Verschieben und Schreiben in Drive.'
              : 'Nativer Drive-Zugriff für Lesen und Hochladen.'
          }
          className={cn(
            'flex-1 flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-colors min-w-0',
            mitComposio ? 'border-[#7c3aed] bg-[#faf5ff]' : 'border-[#e5e5e5] bg-white hover:bg-[#f5f5f5]',
          )}
        >
          <Image
            src={mitComposio ? '/logos/composio.png' : '/logos/google-drive.png'}
            width={14}
            height={14}
            alt=""
            className="shrink-0 object-contain"
          />
          <span className={cn('text-[11px] font-semibold truncate', mitComposio ? 'text-[#7c3aed]' : 'text-[#262626]')}>
            {mitComposio ? 'Composio' : 'Drive direkt'}
          </span>
          {mitComposio ? (
            <ToggleRight className="ml-auto h-3.5 w-3.5 text-[#7c3aed] shrink-0" />
          ) : (
            <ToggleLeft className="ml-auto h-3.5 w-3.5 text-[#a3a3a3] shrink-0" />
          )}
        </button>
      </div>

      {/* 3 · Kontext */}
      <div className="flex flex-col flex-1 min-h-0 border-b border-[#e5e5e5]">
        <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider">
            2 · Kontext
            {bausteine.length > 0 && <span className="ml-1.5 font-medium text-[#737373]">{bausteine.length}</span>}
          </p>
          {bausteine.length > 0 && (
            <button
              onClick={onBausteineLeeren}
              className="text-[10px] text-[#737373] hover:text-[#000000] transition-colors rounded-full px-2 py-0.5 hover:bg-[#e5e5e5]"
            >
              Alle entfernen
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
          {bausteine.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2 py-6">
              <Clipboard className="h-7 w-7 text-[#d4d4d4]" />
              <p className="text-[11px] text-[#a3a3a3] leading-relaxed">
                Klicke auf Ordner oder Dateien links um Kontext-Bausteine zu sammeln.
              </p>
            </div>
          ) : (
            bausteine.map((b) => <BausteinKarte key={b.id} baustein={b} onEntfernen={onBausteinEntfernen} />)
          )}
        </div>
      </div>

      {/* 4 · Ausgabe-Format */}
      <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[#e5e5e5]">
        <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">3 · Ausgabe-Format</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: 'pdf', label: 'PDF', logo: 'pdf.png' },
              { key: 'word', label: 'Word', logo: 'word.png' },
              { key: 'excel', label: 'Excel', logo: 'excel.png' },
              { key: 'scan', label: 'Statusbericht', logo: null },
            ] as const
          ).map(({ key, logo, label }) => (
            <button
              key={key}
              onClick={() => onAusgabeFormatToggle(key)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border py-2.5 transition-colors',
                ausgabeFormat === key
                  ? 'border-[#000000] bg-[#f5f5f5]'
                  : 'border-[#e5e5e5] bg-white hover:bg-[#f5f5f5]',
              )}
            >
              {logo ? (
                <Image src={`/logos/${logo}`} width={20} height={20} alt={label} className="object-contain" />
              ) : (
                <ScanSearch className={cn('h-5 w-5', ausgabeFormat === key ? 'text-[#000000]' : 'text-[#a3a3a3]')} />
              )}
              <span
                className={cn('text-[10px] font-semibold', ausgabeFormat === key ? 'text-[#000000]' : 'text-[#737373]')}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5 · Aufgabe */}
      <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[#e5e5e5]">
        <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">4 · Aufgabe</p>
        <textarea
          value={aufgabe}
          onChange={(e) => onAufgabeChange(e.target.value)}
          rows={2}
          placeholder="z.B. Rechnung für Müller GmbH erstellen …"
          className="w-full text-[11px] text-[#262626] placeholder:text-[#d4d4d4] bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 outline-none focus:border-[#a3a3a3] resize-none leading-relaxed transition-colors"
        />
      </div>

      {/* Prompt kopieren */}
      <div className="shrink-0 p-3">
        <button
          onClick={onKopieren}
          disabled={bausteine.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-full py-2 text-[12px] font-medium transition-colors',
            bausteine.length === 0
              ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
              : kopiert
                ? 'bg-[#000000] text-white'
                : 'bg-[#000000] text-white hover:bg-[#262626]',
          )}
        >
          {kopiert ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Kopiert!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Prompt kopieren
            </>
          )}
        </button>
        {bausteine.length > 0 && (
          <p className="mt-1.5 text-center text-[10px] text-[#a3a3a3]">
            {bausteine.length} {bausteine.length === 1 ? 'Baustein' : 'Bausteine'}
            {ausgabeFormat
              ? ` · ${ausgabeFormat === 'scan' ? 'Statusbericht' : ausgabeFormat.toUpperCase()}`
              : ''}
          </p>
        )}
      </div>
    </div>
  );
}
