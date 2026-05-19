'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEEHAFER_STRUKTUR, findeEintrag, type OrdnerEintrag, type DateiTyp } from '@/lib/automationen/ordner-struktur';
import {
  STORAGE_KEY,
  aktualisiereEintrag,
  fuegeKindHinzu,
  loescheAus,
  ladeStruktur,
  sucheName,
  type AusgabeFormat,
  type Baustein,
} from './datei-browser-helpers';
import { Spalte } from './datei-browser-spalte';
import { PromptBuilder } from './datei-browser-prompt-builder';

export function DateiBrowser(): React.JSX.Element {
  const [navigationsPfad, setNavigationsPfad] = useState<string[]>([]);
  const [verlauf, setVerlauf] = useState<string[][]>([[]]);
  const [verlaufIndex, setVerlaufIndex] = useState(0);
  const [bausteine, setBausteine] = useState<Baustein[]>([]);
  const [kopiert, setKopiert] = useState(false);
  const [mitComposio, setMitComposio] = useState(true);
  const [ausgabeFormat, setAusgabeFormat] = useState<AusgabeFormat>(null);
  const [aufgabe, setAufgabe] = useState('');
  const [struktur, setStruktur] = useState<OrdnerEintrag>(ladeStruktur);
  const [neuEintragId, setNeuEintragId] = useState<string | null>(null);
  const spaltenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(struktur));
  }, [struktur]);

  useEffect(() => {
    setNavigationsPfad(verlauf[verlaufIndex]);
  }, [verlauf, verlaufIndex]);

  useEffect(() => {
    if (spaltenRef.current) spaltenRef.current.scrollLeft = spaltenRef.current.scrollWidth;
  }, [navigationsPfad.length]);

  const navigiereZuPfad = useCallback(
    (neuerPfad: string[]): void => {
      setVerlauf((prev) => [...prev.slice(0, verlaufIndex + 1), neuerPfad]);
      setVerlaufIndex((i) => i + 1);
    },
    [verlaufIndex],
  );

  const handleZurueck = useCallback((): void => {
    if (verlaufIndex > 0) setVerlaufIndex((i) => i - 1);
  }, [verlaufIndex]);
  const handleVorwaerts = useCallback((): void => {
    if (verlaufIndex < verlauf.length - 1) setVerlaufIndex((i) => i + 1);
  }, [verlaufIndex, verlauf.length]);

  const handleKlick = useCallback(
    (eintrag: OrdnerEintrag, spaltenIndex: number): void => {
      navigiereZuPfad([...navigationsPfad.slice(0, spaltenIndex), eintrag.id]);
      if (eintrag.kontext) {
        setBausteine((prev) => {
          if (prev.find((b) => b.id === eintrag.id)) return prev;
          const pfadLabel = [
            ...navigationsPfad.slice(0, spaltenIndex).map((id) => sucheName(id, struktur) ?? id),
            eintrag.name,
          ].join(' / ');
          return [
            ...prev,
            {
              id: eintrag.id,
              name: eintrag.name,
              type: eintrag.type,
              logo: eintrag.logo,
              pfad: pfadLabel,
              kontext: eintrag.kontext ?? '',
            },
          ];
        });
      }
    },
    [navigationsPfad, navigiereZuPfad, struktur],
  );

  const handleSpeichern = useCallback(
    (id: string, name: string, kontext: string, type: DateiTyp, logo: string): void => {
      setStruktur((prev) => aktualisiereEintrag(prev, id, { name, kontext, type, logo }));
      setBausteine((prev) => prev.map((b) => (b.id === id ? { ...b, name, kontext, type, logo } : b)));
      setNeuEintragId(null);
    },
    [],
  );

  const handleLoeschen = useCallback((id: string): void => {
    setStruktur((prev) => loescheAus(prev, id));
    setBausteine((prev) => prev.filter((b) => b.id !== id));
    setNavigationsPfad((prev) => prev.filter((pid) => pid !== id));
  }, []);

  const handleHinzufuegen = useCallback((elternId: string): void => {
    const neuesId = `neu_${Date.now()}`;
    setStruktur((prev) =>
      fuegeKindHinzu(prev, elternId, {
        id: neuesId,
        name: 'Neuer Ordner',
        type: 'folder',
        logo: 'google-drive.png',
        kontext: '',
        kinder: [],
      }),
    );
    setNeuEintragId(neuesId);
  }, []);

  const handleReset = useCallback((): void => {
    if (!confirm('Ordnerstruktur auf Standard zurücksetzen? Alle Änderungen gehen verloren.')) return;
    localStorage.removeItem(STORAGE_KEY);
    setStruktur(SEEHAFER_STRUKTUR);
    setNavigationsPfad([]);
    setVerlauf([[]]);
    setVerlaufIndex(0);
    setBausteine([]);
    setNeuEintragId(null);
  }, []);

  const handleKopieren = useCallback(async (): Promise<void> => {
    if (bausteine.length === 0) return;
    const connectorZeile = mitComposio
      ? 'Nutze Composio um auf Google Drive zuzugreifen.'
      : 'Greife direkt auf Google Drive zu.';
    const formatMap: Record<NonNullable<AusgabeFormat>, string> = {
      pdf: 'Erstelle die Ausgabe als PDF-Dokument.',
      word: 'Erstelle die Ausgabe als Word-Dokument (.docx).',
      excel: 'Erstelle die Ausgabe als Excel-Tabelle (.xlsx).',
      scan: 'Erstelle einen strukturierten Statusbericht / Scan der Inhalte mit Zusammenfassung, Auffälligkeiten und nächsten Schritten.',
    };
    const zeilen: string[] = [
      `Hey Claude. ${connectorZeile}`,
      '',
      'Öffne und nutze folgende Ordner / Dateien in Google Drive:',
      '',
    ];
    for (const b of bausteine) {
      zeilen.push(`**${b.name}**`, `Pfad: ${b.pfad}`, b.kontext, '');
    }
    if (ausgabeFormat) zeilen.push(formatMap[ausgabeFormat]);
    if (aufgabe.trim()) zeilen.push('', `Aufgabe: ${aufgabe.trim()}`);
    const text = zeilen.join('\n').trimEnd();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  }, [bausteine, mitComposio, ausgabeFormat, aufgabe]);

  const spaltenDaten: { eintraege: OrdnerEintrag[]; elternId: string }[] = [
    { eintraege: struktur.kinder ?? [], elternId: struktur.id },
  ];
  for (const id of navigationsPfad) {
    const eintrag = findeEintrag(id, struktur);
    if (eintrag?.type === 'folder') spaltenDaten.push({ eintraege: eintrag.kinder ?? [], elternId: id });
    else break;
  }

  const kannZurueck = verlaufIndex > 0;
  const kannVorwaerts = verlaufIndex < verlauf.length - 1;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Linke Seite: Ordnerstruktur */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[#e5e5e5] bg-white">
          <div className="flex gap-1">
            <button
              onClick={handleZurueck}
              disabled={!kannZurueck}
              title="Zurück"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                kannZurueck ? 'text-[#262626] hover:bg-[#f5f5f5]' : 'text-[#d4d4d4] cursor-not-allowed',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleVorwaerts}
              disabled={!kannVorwaerts}
              title="Vorwärts"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                kannVorwaerts ? 'text-[#262626] hover:bg-[#f5f5f5]' : 'text-[#d4d4d4] cursor-not-allowed',
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
            <span className="text-[11px] text-[#737373] shrink-0">{struktur.name}</span>
            {navigationsPfad.map((id) => {
              const name = sucheName(id, struktur);
              return name ? (
                <span key={id} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="h-3 w-3 text-[#a3a3a3] shrink-0" />
                  <span className="text-[11px] text-[#737373] truncate">{name}</span>
                </span>
              ) : null;
            })}
          </div>
          <button
            onClick={handleReset}
            className="shrink-0 flex items-center gap-1.5 text-[11px] text-[#a3a3a3] hover:text-[#000000] transition-colors px-2 py-1 rounded-lg hover:bg-[#f5f5f5]"
            title="Auf Standard zurücksetzen"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div ref={spaltenRef} className="flex flex-1 overflow-x-auto overflow-y-hidden bg-white">
          {spaltenDaten.map(({ eintraege, elternId }, index) => (
            <Spalte
              key={elternId}
              eintraege={eintraege}
              aktivId={navigationsPfad[index] ?? null}
              elternId={elternId}
              neuEintragId={neuEintragId}
              onKlick={(eintrag) => handleKlick(eintrag, index)}
              onSpeichern={handleSpeichern}
              onLoeschen={handleLoeschen}
              onHinzufuegen={handleHinzufuegen}
            />
          ))}
          <div className="flex-1 min-w-8" />
        </div>
      </div>

      {/* Rechte Seite: Prompt-Builder */}
      <PromptBuilder
        bausteine={bausteine}
        mitComposio={mitComposio}
        ausgabeFormat={ausgabeFormat}
        aufgabe={aufgabe}
        kopiert={kopiert}
        onToggleComposio={() => setMitComposio((v) => !v)}
        onBausteineLeeren={() => setBausteine([])}
        onBausteinEntfernen={(id) => setBausteine((prev) => prev.filter((x) => x.id !== id))}
        onAusgabeFormatToggle={(format) => setAusgabeFormat((f) => (f === format ? null : format))}
        onAufgabeChange={setAufgabe}
        onKopieren={handleKopieren}
      />
    </div>
  );
}
