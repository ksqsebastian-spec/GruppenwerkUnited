'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Folder, FileText, Table2, File, FileCode, X, Copy, Check, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEEHAFER_STRUKTUR, findeKinder, type OrdnerEintrag, type DateiTyp } from '@/lib/automationen/ordner-struktur';

interface Baustein {
  id: string;
  name: string;
  type: DateiTyp;
  pfad: string;
  kontext: string;
}

function DateiIcon({ type, className }: { type: DateiTyp; className?: string }): React.JSX.Element {
  const base = cn('shrink-0', className);
  if (type === 'folder')   return <Folder    className={cn(base, 'text-[#3b82f6]')} />;
  if (type === 'docx')     return <FileText  className={cn(base, 'text-[#2563eb]')} />;
  if (type === 'sheet')    return <Table2    className={cn(base, 'text-[#16a34a]')} />;
  if (type === 'pdf')      return <File      className={cn(base, 'text-[#dc2626]')} />;
  return                          <FileCode  className={cn(base, 'text-[#d97706]')} />;
}

function BausteinKarte({ baustein, onEntfernen }: { baustein: Baustein; onEntfernen: (id: string) => void }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 group relative">
      <div className="flex items-start gap-2">
        <DateiIcon type={baustein.type} className="h-4 w-4 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#000000] truncate">{baustein.name}</p>
          <p className="text-[10px] text-[#737373] mt-0.5 line-clamp-3 leading-relaxed">{baustein.kontext}</p>
        </div>
        <button
          onClick={() => onEntfernen(baustein.id)}
          className="shrink-0 h-4 w-4 flex items-center justify-center rounded-full text-[#737373] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
          title="Entfernen"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface SpalteProps {
  eintraege: OrdnerEintrag[];
  aktivId: string | null;
  onKlick: (eintrag: OrdnerEintrag) => void;
}

function Spalte({ eintraege, aktivId, onKlick }: SpalteProps): React.JSX.Element {
  return (
    <div className="flex-shrink-0 w-52 h-full border-r border-[#e5e5e5] overflow-y-auto">
      <ul className="py-1">
        {eintraege.map((eintrag) => (
          <li key={eintrag.id}>
            <button
              onClick={() => onKlick(eintrag)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors',
                aktivId === eintrag.id
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-[#262626] hover:bg-[#f5f5f5]'
              )}
            >
              <DateiIcon
                type={eintrag.type}
                className={cn('h-4 w-4', aktivId === eintrag.id && 'text-white')}
              />
              <span className="text-[12px] font-medium truncate flex-1">{eintrag.name}</span>
              {eintrag.type === 'folder' && eintrag.kinder && eintrag.kinder.length > 0 && (
                <ChevronRight className={cn('h-3 w-3 shrink-0', aktivId === eintrag.id ? 'text-white' : 'text-[#a3a3a3]')} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DateiBrowser(): React.JSX.Element {
  // navigationsPfad[i] = ID der ausgewählten Row in Spalte i
  const [navigationsPfad, setNavigationsPfad] = useState<string[]>([]);
  // Verlauf für Back/Forward: jeder Eintrag ist ein Pfad-Snapshot
  const [verlauf, setVerlauf] = useState<string[][]>([[]]);
  const [verlaufIndex, setVerlaufIndex] = useState(0);
  const [bausteine, setBausteine] = useState<Baustein[]>([]);
  const [kopiert, setKopiert] = useState(false);
  const spaltenRef = useRef<HTMLDivElement>(null);

  // Pfad aus dem Verlauf holen
  useEffect(() => {
    setNavigationsPfad(verlauf[verlaufIndex]);
  }, [verlauf, verlaufIndex]);

  // Neu-Spalte → automatisch nach rechts scrollen
  useEffect(() => {
    if (spaltenRef.current) {
      spaltenRef.current.scrollLeft = spaltenRef.current.scrollWidth;
    }
  }, [navigationsPfad.length]);

  const navigiereZuPfad = useCallback((neuerPfad: string[]): void => {
    setVerlauf((prev) => {
      const geschnitten = prev.slice(0, verlaufIndex + 1);
      return [...geschnitten, neuerPfad];
    });
    setVerlaufIndex((i) => i + 1);
  }, [verlaufIndex]);

  const handleZurueck = useCallback((): void => {
    if (verlaufIndex > 0) setVerlaufIndex((i) => i - 1);
  }, [verlaufIndex]);

  const handleVorwaerts = useCallback((): void => {
    if (verlaufIndex < verlauf.length - 1) setVerlaufIndex((i) => i + 1);
  }, [verlaufIndex, verlauf.length]);

  const handleKlick = useCallback((eintrag: OrdnerEintrag, spaltenIndex: number): void => {
    // Pfad bis zur aktuellen Spalte + neue Auswahl
    const neuerPfad = [...navigationsPfad.slice(0, spaltenIndex), eintrag.id];

    // Verzeichnisse erweitern die Spalten-Navigation
    if (eintrag.type === 'folder') {
      const kinder = eintrag.kinder ?? [];
      // Nur wenn Kinder vorhanden, einen neuen Pfad aufbauen
      navigiereZuPfad(kinder.length > 0 ? neuerPfad : neuerPfad);
    } else {
      // Bei Datei: Auswahl stoppen, keine weiteren Spalten
      navigiereZuPfad(neuerPfad);
    }

    // Kontext-Baustein hinzufügen wenn vorhanden und noch nicht drin
    const kontext = eintrag.kontext;
    if (kontext) {
      setBausteine((prev) => {
        if (prev.find((b) => b.id === eintrag.id)) return prev;
        const pfadLabel = [...navigationsPfad.slice(0, spaltenIndex).map((id) => {
          const found = sucheName(id, SEEHAFER_STRUKTUR);
          return found ?? id;
        }), eintrag.name].join(' / ');
        return [
          ...prev,
          { id: eintrag.id, name: eintrag.name, type: eintrag.type, pfad: pfadLabel, kontext },
        ];
      });
    }
  }, [navigationsPfad, navigiereZuPfad]);

  const entferneBaustein = useCallback((id: string): void => {
    setBausteine((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleKopieren = useCallback(async (): Promise<void> => {
    if (bausteine.length === 0) return;
    const text = bausteine
      .map((b) => `## ${b.name}\n${b.kontext}`)
      .join('\n\n---\n\n');
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
  }, [bausteine]);

  // Spalten aufbauen: erste Spalte = Root-Kinder, dann je nach Pfad
  const spaltenDaten: OrdnerEintrag[][] = [SEEHAFER_STRUKTUR.kinder ?? []];
  for (let i = 0; i < navigationsPfad.length; i++) {
    const id = navigationsPfad[i];
    const kinder = findeKinder(id, SEEHAFER_STRUKTUR);
    if (kinder && kinder.length > 0) {
      spaltenDaten.push(kinder);
    } else {
      break;
    }
  }

  const kannZurueck = verlaufIndex > 0;
  const kannVorwaerts = verlaufIndex < verlauf.length - 1;
  const promptText = bausteine.map((b) => `## ${b.name}\n${b.kontext}`).join('\n\n---\n\n');

  return (
    <div className="flex h-full overflow-hidden">
      {/* Linke Seite: Spalten-Navigation */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[#e5e5e5] bg-white">
          <div className="flex gap-1">
            <button
              onClick={handleZurueck}
              disabled={!kannZurueck}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                kannZurueck
                  ? 'text-[#262626] hover:bg-[#f5f5f5]'
                  : 'text-[#d4d4d4] cursor-not-allowed'
              )}
              title="Zurück"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleVorwaerts}
              disabled={!kannVorwaerts}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                kannVorwaerts
                  ? 'text-[#262626] hover:bg-[#f5f5f5]'
                  : 'text-[#d4d4d4] cursor-not-allowed'
              )}
              title="Vorwärts"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            <span className="text-[11px] text-[#737373] shrink-0">Seehafer Elemente</span>
            {navigationsPfad.map((id) => {
              const name = sucheName(id, SEEHAFER_STRUKTUR);
              return name ? (
                <span key={id} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="h-3 w-3 text-[#a3a3a3] shrink-0" />
                  <span className="text-[11px] text-[#737373] truncate">{name}</span>
                </span>
              ) : null;
            })}
          </div>
        </div>

        {/* Spalten */}
        <div
          ref={spaltenRef}
          className="flex flex-1 overflow-x-auto overflow-y-hidden bg-white"
        >
          {spaltenDaten.map((eintraege, index) => {
            const aktivId = navigationsPfad[index] ?? null;
            return (
              <Spalte
                key={index}
                eintraege={eintraege}
                aktivId={aktivId}
                onKlick={(eintrag) => handleKlick(eintrag, index)}
              />
            );
          })}
          {/* Leerraum rechts */}
          <div className="flex-1 min-w-8" />
        </div>
      </div>

      {/* Rechte Seite: Prompt-Panel */}
      <div className="shrink-0 w-80 flex flex-col border-l border-[#e5e5e5] bg-[#fafafa]">
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[#e5e5e5]">
          <span className="text-[12px] font-semibold text-[#000000]">
            Kontext-Bausteine
            {bausteine.length > 0 && (
              <span className="ml-1.5 text-[10px] font-medium text-[#737373]">
                {bausteine.length}
              </span>
            )}
          </span>
          {bausteine.length > 0 && (
            <button
              onClick={() => setBausteine([])}
              className="text-[10px] text-[#737373] hover:text-[#000000] transition-colors rounded-full px-2 py-0.5 hover:bg-[#e5e5e5]"
            >
              Alle entfernen
            </button>
          )}
        </div>

        {/* Bausteine-Liste */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {bausteine.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
              <Clipboard className="h-8 w-8 text-[#d4d4d4]" />
              <p className="text-[11px] text-[#a3a3a3] leading-relaxed">
                Klicke auf Ordner oder Dateien links um Kontext-Bausteine für deinen KI-Prompt zu sammeln.
              </p>
            </div>
          ) : (
            bausteine.map((b) => (
              <BausteinKarte key={b.id} baustein={b} onEntfernen={entferneBaustein} />
            ))
          )}
        </div>

        {/* Kopieren-Button */}
        <div className="shrink-0 p-3 border-t border-[#e5e5e5]">
          <button
            onClick={handleKopieren}
            disabled={bausteine.length === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-full py-2 text-[12px] font-medium transition-colors',
              bausteine.length === 0
                ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
                : kopiert
                  ? 'bg-[#000000] text-white'
                  : 'bg-[#000000] text-white hover:bg-[#262626]'
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
              {promptText.length} Zeichen · {bausteine.length} {bausteine.length === 1 ? 'Baustein' : 'Bausteine'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Hilfsfunktion: Sucht den Namen eines Eintrags anhand seiner ID im Baum. */
function sucheName(id: string, baum: OrdnerEintrag): string | null {
  if (baum.id === id) return baum.name;
  for (const kind of baum.kinder ?? []) {
    const gefunden = sucheName(id, kind);
    if (gefunden !== null) return gefunden;
  }
  return null;
}
