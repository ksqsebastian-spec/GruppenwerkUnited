'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  ChevronLeft, ChevronRight, Folder, FileText, Table2, File, FileCode,
  X, Copy, Check, Clipboard, ToggleLeft, ToggleRight, ScanSearch,
  Pencil, Plus, Trash2, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SEEHAFER_STRUKTUR, findeEintrag,
  type OrdnerEintrag, type DateiTyp,
} from '@/lib/automationen/ordner-struktur';

const STORAGE_KEY = 'seehafer-struktur-v1';
type AusgabeFormat = 'pdf' | 'word' | 'excel' | 'scan' | null;

const TYPE_OPTIONEN: { type: DateiTyp; logo: string; label: string }[] = [
  { type: 'folder',   logo: 'google-drive.png', label: 'Ordner'   },
  { type: 'docx',     logo: 'word.png',          label: 'Word'     },
  { type: 'sheet',    logo: 'excel.png',          label: 'Excel'    },
  { type: 'pdf',      logo: 'pdf.png',            label: 'PDF'      },
  { type: 'template', logo: 'word.png',            label: 'Vorlage'  },
];

// ── Tree helpers ──────────────────────────────────────────────────────────────

function aktualisiereEintrag(baum: OrdnerEintrag, id: string, delta: Partial<OrdnerEintrag>): OrdnerEintrag {
  if (baum.id === id) return { ...baum, ...delta };
  if (!baum.kinder?.length) return baum;
  return { ...baum, kinder: baum.kinder.map((k) => aktualisiereEintrag(k, id, delta)) };
}

function fuegeKindHinzu(baum: OrdnerEintrag, elternId: string, kind: OrdnerEintrag): OrdnerEintrag {
  if (baum.id === elternId) return { ...baum, kinder: [...(baum.kinder ?? []), kind] };
  if (!baum.kinder?.length) return baum;
  return { ...baum, kinder: baum.kinder.map((k) => fuegeKindHinzu(k, elternId, kind)) };
}

function loescheAus(baum: OrdnerEintrag, id: string): OrdnerEintrag {
  return { ...baum, kinder: (baum.kinder ?? []).filter((k) => k.id !== id).map((k) => loescheAus(k, id)) };
}

function ladeStruktur(): OrdnerEintrag {
  if (typeof window === 'undefined') return SEEHAFER_STRUKTUR;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as OrdnerEintrag) : SEEHAFER_STRUKTUR;
  } catch {
    return SEEHAFER_STRUKTUR;
  }
}

function sucheName(id: string, baum: OrdnerEintrag): string | null {
  if (baum.id === id) return baum.name;
  for (const kind of baum.kinder ?? []) {
    const found = sucheName(id, kind);
    if (found !== null) return found;
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Baustein {
  id: string;
  name: string;
  type: DateiTyp;
  logo?: string;
  pfad: string;
  kontext: string;
}

// ── DateiIcon ─────────────────────────────────────────────────────────────────

function DateiIcon({ type, logo, className }: { type: DateiTyp; logo?: string; className?: string }): React.JSX.Element {
  const base = cn('shrink-0', className);
  if (logo) return <Image src={`/logos/${logo}`} width={16} height={16} alt="" className={cn('shrink-0 object-contain', className?.replace(/text-\S+/g, ''))} />;
  if (type === 'folder') return <Folder   className={cn(base, 'text-[#3b82f6]')} />;
  if (type === 'docx')   return <FileText className={cn(base, 'text-[#2563eb]')} />;
  if (type === 'sheet')  return <Table2   className={cn(base, 'text-[#16a34a]')} />;
  if (type === 'pdf')    return <File     className={cn(base, 'text-[#dc2626]')} />;
  return                        <FileCode className={cn(base, 'text-[#d97706]')} />;
}

// ── BausteinKarte ─────────────────────────────────────────────────────────────

function BausteinKarte({ baustein, onEntfernen }: { baustein: Baustein; onEntfernen: (id: string) => void }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 group relative">
      <div className="flex items-start gap-2">
        <DateiIcon type={baustein.type} logo={baustein.logo} className="h-4 w-4 mt-0.5" />
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

// ── SpalteZeile ───────────────────────────────────────────────────────────────

interface SpalteZeileProps {
  eintrag: OrdnerEintrag;
  aktiv: boolean;
  autoEdit: boolean;
  onKlick: () => void;
  onSpeichern: (id: string, name: string, kontext: string, type: DateiTyp, logo: string) => void;
  onLoeschen: (id: string) => void;
}

function SpalteZeile({ eintrag, aktiv, autoEdit, onKlick, onSpeichern, onLoeschen }: SpalteZeileProps): React.JSX.Element {
  const [editMode, setEditMode] = useState(autoEdit);
  const [editName, setEditName] = useState(eintrag.name);
  const [editKontext, setEditKontext] = useState(eintrag.kontext ?? '');
  const [editType, setEditType] = useState<DateiTyp>(eintrag.type);
  const [editLogo, setEditLogo] = useState(eintrag.logo ?? TYPE_OPTIONEN[0].logo);

  const speichern = (): void => {
    if (editName.trim()) onSpeichern(eintrag.id, editName.trim(), editKontext.trim(), editType, editLogo);
    setEditMode(false);
  };

  const abbrechen = (): void => {
    setEditName(eintrag.name);
    setEditKontext(eintrag.kontext ?? '');
    setEditType(eintrag.type);
    setEditLogo(eintrag.logo ?? TYPE_OPTIONEN[0].logo);
    setEditMode(false);
  };

  if (editMode) {
    return (
      <div className="px-2 py-2 bg-[#f5f5f5] border-b border-[#e5e5e5]">
        {/* Typ-Auswahl */}
        <div className="flex gap-1 mb-1.5">
          {TYPE_OPTIONEN.map((opt) => (
            <button
              key={opt.type}
              onClick={() => { setEditType(opt.type); setEditLogo(opt.logo); }}
              title={opt.label}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg border transition-colors',
                editType === opt.type ? 'border-[#3b82f6] bg-white' : 'border-transparent hover:bg-white'
              )}
            >
              <Image src={`/logos/${opt.logo}`} width={14} height={14} alt={opt.label} className="object-contain" />
              <span className="text-[8px] text-[#737373] leading-none">{opt.label}</span>
            </button>
          ))}
        </div>
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') speichern(); if (e.key === 'Escape') abbrechen(); }}
          className="w-full text-[12px] font-medium bg-white border border-[#e5e5e5] rounded-lg px-2 py-1 outline-none focus:border-[#3b82f6]"
          placeholder="Name"
        />
        <textarea
          value={editKontext}
          onChange={(e) => setEditKontext(e.target.value)}
          rows={3}
          className="mt-1.5 w-full text-[10px] text-[#737373] bg-white border border-[#e5e5e5] rounded-lg px-2 py-1 outline-none focus:border-[#3b82f6] resize-none leading-relaxed"
          placeholder="Kontext für den KI-Prompt…"
        />
        <div className="flex gap-1.5 mt-1.5">
          <button onClick={speichern} className="flex-1 text-[10px] font-semibold bg-[#000000] text-white rounded-lg py-1 hover:bg-[#262626] transition-colors">
            Speichern
          </button>
          <button onClick={abbrechen} className="flex-1 text-[10px] font-medium text-[#737373] bg-white border border-[#e5e5e5] rounded-lg py-1 hover:bg-[#f0f0f0] transition-colors">
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        onClick={onKlick}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 pr-14 text-left transition-colors',
          aktiv ? 'bg-[#3b82f6] text-white' : 'text-[#262626] hover:bg-[#f5f5f5]',
        )}
      >
        <DateiIcon type={eintrag.type} logo={aktiv ? undefined : eintrag.logo} className={cn('h-4 w-4', aktiv && 'text-white')} />
        <span className="text-[12px] font-medium truncate flex-1">{eintrag.name}</span>
        {eintrag.type === 'folder' && (eintrag.kinder?.length ?? 0) > 0 && (
          <ChevronRight className={cn('h-3 w-3 shrink-0', aktiv ? 'text-white' : 'text-[#a3a3a3]')} />
        )}
      </button>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setEditMode(true); }}
          className="h-5 w-5 flex items-center justify-center rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#e5e5e5] transition-colors"
          title="Bearbeiten"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onLoeschen(eintrag.id); }}
          className="h-5 w-5 flex items-center justify-center rounded text-[#a3a3a3] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
          title="Löschen"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Spalte ────────────────────────────────────────────────────────────────────

interface SpalteProps {
  eintraege: OrdnerEintrag[];
  aktivId: string | null;
  elternId: string;
  neuEintragId: string | null;
  onKlick: (eintrag: OrdnerEintrag) => void;
  onSpeichern: (id: string, name: string, kontext: string, type: DateiTyp, logo: string) => void;
  onLoeschen: (id: string) => void;
  onHinzufuegen: (elternId: string) => void;
}

function Spalte({ eintraege, aktivId, elternId, neuEintragId, onKlick, onSpeichern, onLoeschen, onHinzufuegen }: SpalteProps): React.JSX.Element {
  return (
    <div className="flex-shrink-0 w-52 h-full border-r border-[#e5e5e5] overflow-y-auto flex flex-col">
      <ul className="flex-1 py-1">
        {eintraege.map((eintrag) => (
          <li key={eintrag.id}>
            <SpalteZeile
              eintrag={eintrag}
              aktiv={aktivId === eintrag.id}
              autoEdit={neuEintragId === eintrag.id}
              onKlick={() => onKlick(eintrag)}
              onSpeichern={onSpeichern}
              onLoeschen={onLoeschen}
            />
          </li>
        ))}
      </ul>
      <button
        onClick={() => onHinzufuegen(elternId)}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]"
      >
        <Plus className="h-3 w-3" />
        Hinzufügen
      </button>
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

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

  const navigiereZuPfad = useCallback((neuerPfad: string[]): void => {
    setVerlauf((prev) => [...prev.slice(0, verlaufIndex + 1), neuerPfad]);
    setVerlaufIndex((i) => i + 1);
  }, [verlaufIndex]);

  const handleZurueck  = useCallback((): void => { if (verlaufIndex > 0) setVerlaufIndex((i) => i - 1); }, [verlaufIndex]);
  const handleVorwaerts = useCallback((): void => { if (verlaufIndex < verlauf.length - 1) setVerlaufIndex((i) => i + 1); }, [verlaufIndex, verlauf.length]);

  const handleKlick = useCallback((eintrag: OrdnerEintrag, spaltenIndex: number): void => {
    navigiereZuPfad([...navigationsPfad.slice(0, spaltenIndex), eintrag.id]);
    if (eintrag.kontext) {
      setBausteine((prev) => {
        if (prev.find((b) => b.id === eintrag.id)) return prev;
        const pfadLabel = [...navigationsPfad.slice(0, spaltenIndex).map((id) => sucheName(id, struktur) ?? id), eintrag.name].join(' / ');
        return [...prev, { id: eintrag.id, name: eintrag.name, type: eintrag.type, logo: eintrag.logo, pfad: pfadLabel, kontext: eintrag.kontext ?? '' }];
      });
    }
  }, [navigationsPfad, navigiereZuPfad, struktur]);

  const handleSpeichern = useCallback((id: string, name: string, kontext: string, type: DateiTyp, logo: string): void => {
    setStruktur((prev) => aktualisiereEintrag(prev, id, { name, kontext, type, logo }));
    setBausteine((prev) => prev.map((b) => b.id === id ? { ...b, name, kontext, type, logo } : b));
    setNeuEintragId(null);
  }, []);

  const handleLoeschen = useCallback((id: string): void => {
    setStruktur((prev) => loescheAus(prev, id));
    setBausteine((prev) => prev.filter((b) => b.id !== id));
    setNavigationsPfad((prev) => prev.filter((pid) => pid !== id));
  }, []);

  const handleHinzufuegen = useCallback((elternId: string): void => {
    const neuesId = `neu_${Date.now()}`;
    setStruktur((prev) => fuegeKindHinzu(prev, elternId, {
      id: neuesId, name: 'Neuer Ordner', type: 'folder', logo: 'google-drive.png', kontext: '', kinder: [],
    }));
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
    const connectorZeile = mitComposio ? 'Nutze Composio um auf Google Drive zuzugreifen.' : 'Greife direkt auf Google Drive zu.';
    const formatMap: Record<NonNullable<AusgabeFormat>, string> = {
      pdf:   'Erstelle die Ausgabe als PDF-Dokument.',
      word:  'Erstelle die Ausgabe als Word-Dokument (.docx).',
      excel: 'Erstelle die Ausgabe als Excel-Tabelle (.xlsx).',
      scan:  'Erstelle einen strukturierten Statusbericht / Scan der Inhalte mit Zusammenfassung, Auffälligkeiten und nächsten Schritten.',
    };
    const zeilen: string[] = [`Hey Claude. ${connectorZeile}`, '', 'Öffne und nutze folgende Ordner / Dateien in Google Drive:', ''];
    for (const b of bausteine) { zeilen.push(`**${b.name}**`, `Pfad: ${b.pfad}`, b.kontext, ''); }
    if (ausgabeFormat) zeilen.push(formatMap[ausgabeFormat]);
    if (aufgabe.trim()) zeilen.push('', `Aufgabe: ${aufgabe.trim()}`);
    const text = zeilen.join('\n').trimEnd();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
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

  const kannZurueck  = verlaufIndex > 0;
  const kannVorwaerts = verlaufIndex < verlauf.length - 1;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Linke Seite */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[#e5e5e5] bg-white">
          <div className="flex gap-1">
            <button onClick={handleZurueck}  disabled={!kannZurueck}  title="Zurück"   className={cn('flex h-7 w-7 items-center justify-center rounded-full transition-colors', kannZurueck  ? 'text-[#262626] hover:bg-[#f5f5f5]' : 'text-[#d4d4d4] cursor-not-allowed')}><ChevronLeft  className="h-4 w-4" /></button>
            <button onClick={handleVorwaerts} disabled={!kannVorwaerts} title="Vorwärts" className={cn('flex h-7 w-7 items-center justify-center rounded-full transition-colors', kannVorwaerts ? 'text-[#262626] hover:bg-[#f5f5f5]' : 'text-[#d4d4d4] cursor-not-allowed')}><ChevronRight className="h-4 w-4" /></button>
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
          <button onClick={handleReset} className="shrink-0 flex items-center gap-1.5 text-[11px] text-[#a3a3a3] hover:text-[#000000] transition-colors px-2 py-1 rounded-lg hover:bg-[#f5f5f5]" title="Auf Standard zurücksetzen">
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
      <div className="shrink-0 w-80 flex flex-col border-l border-[#e5e5e5] bg-[#fafafa]">

        {/* 1 · KI */}
        <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[#e5e5e5]">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">1 · KI</p>
          <div className="flex items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-3 py-2">
            <Image src="/logos/claude.png" width={18} height={18} alt="Claude" className="shrink-0 object-contain" />
            <span className="text-[12px] font-semibold text-[#000000]">Claude</span>
            <span className="ml-auto text-[10px] text-[#a3a3a3]">immer aktiv</span>
          </div>
        </div>

        {/* 2 · Connector */}
        <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[#e5e5e5]">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">2 · Connector</p>
          <button
            onClick={() => setMitComposio((v) => !v)}
            className={cn('w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors', mitComposio ? 'border-[#7c3aed] bg-[#faf5ff]' : 'border-[#e5e5e5] bg-white hover:bg-[#f5f5f5]')}
          >
            <Image src={mitComposio ? '/logos/composio.png' : '/logos/google-drive.png'} width={18} height={18} alt="" className="shrink-0 object-contain" />
            <span className={cn('text-[12px] font-semibold', mitComposio ? 'text-[#7c3aed]' : 'text-[#262626]')}>{mitComposio ? 'Composio' : 'Google Drive direkt'}</span>
            {mitComposio ? <ToggleRight className="ml-auto h-4 w-4 text-[#7c3aed] shrink-0" /> : <ToggleLeft className="ml-auto h-4 w-4 text-[#a3a3a3] shrink-0" />}
          </button>
          <p className="mt-1.5 text-[10px] text-[#a3a3a3] leading-relaxed">
            {mitComposio ? 'Composio ermöglicht Umbenennen, Verschieben und Schreiben in Drive.' : 'Nativer Drive-Zugriff für Lesen und Hochladen.'}
          </p>
        </div>

        {/* 3 · Kontext */}
        <div className="flex flex-col flex-1 min-h-0 border-b border-[#e5e5e5]">
          <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider">
              3 · Kontext{bausteine.length > 0 && <span className="ml-1.5 font-medium text-[#737373]">{bausteine.length}</span>}
            </p>
            {bausteine.length > 0 && (
              <button onClick={() => setBausteine([])} className="text-[10px] text-[#737373] hover:text-[#000000] transition-colors rounded-full px-2 py-0.5 hover:bg-[#e5e5e5]">
                Alle entfernen
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
            {bausteine.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2 py-6">
                <Clipboard className="h-7 w-7 text-[#d4d4d4]" />
                <p className="text-[11px] text-[#a3a3a3] leading-relaxed">Klicke auf Ordner oder Dateien links um Kontext-Bausteine zu sammeln.</p>
              </div>
            ) : (
              bausteine.map((b) => <BausteinKarte key={b.id} baustein={b} onEntfernen={(id) => setBausteine((prev) => prev.filter((x) => x.id !== id))} />)
            )}
          </div>
        </div>

        {/* 4 · Ausgabe-Format */}
        <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[#e5e5e5]">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">4 · Ausgabe-Format</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'pdf',  label: 'PDF',          logo: 'pdf.png'   },
              { key: 'word', label: 'Word',          logo: 'word.png'  },
              { key: 'excel',label: 'Excel',         logo: 'excel.png' },
              { key: 'scan', label: 'Statusbericht', logo: null        },
            ] as const).map(({ key, logo, label }) => (
              <button
                key={key}
                onClick={() => setAusgabeFormat((f) => f === key ? null : key)}
                className={cn('flex flex-col items-center gap-1.5 rounded-xl border py-2.5 transition-colors', ausgabeFormat === key ? 'border-[#000000] bg-[#f5f5f5]' : 'border-[#e5e5e5] bg-white hover:bg-[#f5f5f5]')}
              >
                {logo
                  ? <Image src={`/logos/${logo}`} width={20} height={20} alt={label} className="object-contain" />
                  : <ScanSearch className={cn('h-5 w-5', ausgabeFormat === key ? 'text-[#000000]' : 'text-[#a3a3a3]')} />
                }
                <span className={cn('text-[10px] font-semibold', ausgabeFormat === key ? 'text-[#000000]' : 'text-[#737373]')}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5 · Aufgabe */}
        <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[#e5e5e5]">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">5 · Aufgabe</p>
          <textarea
            value={aufgabe}
            onChange={(e) => setAufgabe(e.target.value)}
            rows={2}
            placeholder="z.B. Rechnung für Müller GmbH erstellen …"
            className="w-full text-[11px] text-[#262626] placeholder:text-[#d4d4d4] bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 outline-none focus:border-[#a3a3a3] resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Prompt kopieren */}
        <div className="shrink-0 p-3">
          <button
            onClick={handleKopieren}
            disabled={bausteine.length === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-full py-2 text-[12px] font-medium transition-colors',
              bausteine.length === 0 ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed' : kopiert ? 'bg-[#000000] text-white' : 'bg-[#000000] text-white hover:bg-[#262626]'
            )}
          >
            {kopiert ? <><Check className="h-3.5 w-3.5" />Kopiert!</> : <><Copy className="h-3.5 w-3.5" />Prompt kopieren</>}
          </button>
          {bausteine.length > 0 && (
            <p className="mt-1.5 text-center text-[10px] text-[#a3a3a3]">
              {bausteine.length} {bausteine.length === 1 ? 'Baustein' : 'Bausteine'}{ausgabeFormat ? ` · ${ausgabeFormat === 'scan' ? 'Statusbericht' : ausgabeFormat.toUpperCase()}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
