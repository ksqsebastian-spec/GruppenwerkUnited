'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaumKnoten {
  name: string;
  tag?: string;
  open?: boolean;
  kinder?: BaumKnoten[];
}

const BAUM_DATEN: BaumKnoten = {
  name: '[Firma]_Ablage/',
  tag: 'Stammordner',
  open: true,
  kinder: [
    {
      name: '_DB/',
      tag: 'Datenbank',
      open: false,
      kinder: [
        { name: 'Preisliste.xlsx' },
        { name: 'Briefpapier.docx' },
        { name: 'AGB.pdf' },
        { name: 'Textbausteine.docx' },
      ],
    },
    {
      name: '_Vorlagen/',
      tag: 'Blanko-Vorlagen',
      open: false,
      kinder: [
        { name: 'VORLAGE_Angebot.docx' },
        { name: 'VORLAGE_Rechnung.docx' },
        { name: 'VORLAGE_Aufmass.xlsx' },
        { name: 'VORLAGE_Abnahmeprotokoll.docx' },
        { name: 'VORLAGE_Lieferschein.docx' },
      ],
    },
    {
      name: 'Kunden/',
      tag: '80% aller Dateien',
      open: true,
      kinder: [
        {
          name: '2025_SH-C3D4/',
          tag: 'Kundenordner',
          open: true,
          kinder: [
            { name: 'ANG_2025-0042_SH-C3D4_Fenster.pdf' },
            { name: 'AB_2025-0042_SH-C3D4.pdf' },
            { name: 'RE_2025-0042_SH-C3D4.pdf' },
            { name: 'AUF_2025-0042_SH-C3D4.xlsx' },
            { name: 'FOTO_2025-0042_SH-C3D4_Vorher.jpg' },
          ],
        },
        {
          name: '2025_GW-CX9Y-QHJ7/',
          open: false,
          kinder: [{ name: '...' }],
        },
      ],
    },
    {
      name: 'Ausschreibungen/',
      tag: 'VOB & privat',
      open: false,
      kinder: [
        { name: '2025-VOB_Schulamt-Altona_Fenster/' },
        { name: '2025-PRIV_Saga-Wandsbek_Tueren/' },
      ],
    },
  ],
};

const DOKUMENT_TYPEN = [
  { code: 'ANG', label: 'Angebot' },
  { code: 'AB', label: 'Auftragsbestätigung' },
  { code: 'RE', label: 'Rechnung' },
  { code: 'GU', label: 'Gutschrift' },
  { code: 'AUF', label: 'Aufmaß' },
  { code: 'LS', label: 'Lieferschein' },
  { code: 'APR', label: 'Abnahmeprotokoll' },
  { code: 'FOTO', label: 'Foto / Dokumentation' },
  { code: 'KOR', label: 'Korrespondenz' },
  { code: 'PLAN', label: 'Pläne / Zeichnungen' },
  { code: 'MISC', label: 'Sonstiges' },
];

const KUNDEN_PREFIXE = [
  { prefix: 'SH-', name: 'Seehafer Elemente' },
  { prefix: 'HK-', name: 'Maler Hantke' },
  { prefix: 'BK-', name: 'Tischlerei Brink' },
  { prefix: 'WG-', name: 'Werner Gerüstbau' },
  { prefix: 'WB-', name: 'Werner Bau' },
  { prefix: 'MH-', name: 'Mehlig' },
  { prefix: 'BS-', name: 'BSI' },
  { prefix: 'GP-', name: 'GroundPassion' },
  { prefix: 'GW-', name: 'Gruppenwerk (übergreifend)' },
];

const WORKFLOWS = [
  {
    nr: '01',
    title: 'Neuer Kunde',
    beispiel: '"Neuer Kunde, Code ist SH-C3D4"',
    desc: 'Claude fragt nach dem Code, erstellt Ordner unter Kunden/.',
  },
  {
    nr: '02',
    title: 'Dokument ablegen',
    beispiel: '"Leg die Rechnung 2025-0042 für SH-C3D4 ab"',
    desc: 'Claude benennt die Datei korrekt um und speichert im Kundenordner.',
  },
  {
    nr: '03',
    title: 'Dokument erstellen',
    beispiel: '"Mach ein Angebot für SH-E5F6"',
    desc: 'Claude lädt Vorlage + Briefpapier aus _DB/, füllt aus, speichert.',
  },
  {
    nr: '04',
    title: 'Preis nachschlagen',
    beispiel: '"Was kostet eine Haustür?"',
    desc: 'Claude schaut in _DB/Preisliste.xlsx nach.',
  },
  {
    nr: '05',
    title: 'Dokument finden',
    beispiel: '"Wo ist die Rechnung für SH-C3D4?"',
    desc: 'Claude sucht nach Code + Typkürzel und gibt den Pfad zurück.',
  },
  {
    nr: '06',
    title: 'Ablage einrichten',
    beispiel: '"Richte die Ablage für Maler Hantke ein"',
    desc: 'Claude erstellt Stammordner + alle 4 Unterordner auf Google Drive.',
  },
];

const FEHLER_HILFE = [
  { problem: 'Du nennst einen Kundennamen', loesung: 'Claude stoppt und fragt nach dem Code.' },
  { problem: 'Du kennst den Code nicht', loesung: 'Datenkodierungs-Tool öffnen oder Kerim fragen.' },
  { problem: 'Der Code sieht falsch aus', loesung: 'Richtiges Format: SH-XXXX oder GW-XXXX-XXXX' },
  { problem: 'Du weißt nicht welcher Dokumenttyp', loesung: 'Claude zeigt die Kürzel-Tabelle.' },
  { problem: 'Der Kundenordner existiert noch nicht', loesung: 'Claude legt ihn automatisch an.' },
  { problem: 'Du brauchst die Rechnungsnummer', loesung: 'Steht auf dem Dokument oben rechts.' },
];

const REGELN = [
  'Typ immer Großbuchstaben (ANG, RE, AUF …)',
  'Keine Umlaute in Dateinamen (ae, oe, ue, ss)',
  'Code exakt übernehmen, nicht kürzen',
  'Jahr = Erstauftragsjahr, aktuelles Jahr wenn nicht anders gesagt',
  'Beschreibung optional, kurz halten',
  'Vergabestellen (Behörden) dürfen Klarnamen haben',
];

function BaumKnotenKomponente({
  knoten,
  tiefe,
}: {
  knoten: BaumKnoten;
  tiefe: number;
}): React.JSX.Element {
  const [offen, setOffen] = useState(knoten.open ?? false);
  const hatKinder = knoten.kinder && knoten.kinder.length > 0;
  const istOrdner = hatKinder !== undefined && hatKinder;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-[3px] font-mono text-[12px]',
          istOrdner ? 'cursor-pointer font-bold text-[#1a1a1a] hover:bg-[#f5f3ef] rounded px-1 -mx-1' : 'text-[#444]',
        )}
        style={{ paddingLeft: `${tiefe * 16}px` }}
        onClick={istOrdner ? () => setOffen((v) => !v) : undefined}
      >
        <span className="w-4 shrink-0 text-center text-[11px] text-[#aaa]">
          {istOrdner ? (offen ? '▾' : '▸') : '·'}
        </span>
        <span className="flex-1">{knoten.name}</span>
        {knoten.tag && (
          <span className="text-[10px] font-sans font-medium text-[#777] bg-[#f0eeea] border border-[#d5d0c8] px-1.5 py-0.5 rounded-sm ml-2">
            {knoten.tag}
          </span>
        )}
      </div>
      {istOrdner && offen && (
        <div>
          {knoten.kinder!.map((kind, i) => (
            <BaumKnotenKomponente key={i} knoten={kind} tiefe={tiefe + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function validateFilename(val: string): { ok: boolean; message: string } {
  if (!val) return { ok: false, message: '' };

  const typen = ['ANG', 'AB', 'RE', 'GU', 'AUF', 'LS', 'APR', 'FOTO', 'KOR', 'PLAN', 'MISC'];
  const codePattern = /^[A-Z]{2,3}-[A-Z0-9]{3,}(-[A-Z0-9]{3,})?$/;
  const match = val.match(/^([A-Z]+)_(\d{4}-\d{4})_([A-Z]{2,3}-[A-Z0-9-]+?)(?:_([^.]+))?\.(\w+)$/);

  if (!match) {
    return { ok: false, message: '✗ Format nicht erkannt. Schema: {TYP}_{JJJJ-NNNN}_{CODE}_{INFO}.ext' };
  }

  const [, typ, nr, code, info, ext] = match;
  const fehler: string[] = [];
  if (!typen.includes(typ)) fehler.push(`Typ "${typ}" unbekannt`);
  if (!codePattern.test(code)) fehler.push(`Code "${code}" ungültig`);

  if (fehler.length) {
    return { ok: false, message: '✗ ' + fehler.join(' | ') };
  }
  return {
    ok: true,
    message: `✓ ${typ} · Nr. ${nr} · Kunde ${code}${info ? ` · ${info}` : ''} · .${ext}`,
  };
}

type Tab = 'struktur' | 'typen' | 'workflows' | 'hilfe';

export function HandwerkshelferCheatsheet(): React.JSX.Element {
  const [aktiv, setAktiv] = useState<Tab>('struktur');
  const [dateiname, setDateiname] = useState('');

  const validierung = validateFilename(dateiname);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'struktur', label: 'Struktur' },
    { id: 'typen', label: 'Typen & Codes' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'hilfe', label: 'Hilfe' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#fafaf8] font-sans">
      {/* DSGVO-Hinweis */}
      <div className="bg-[#c0392b] px-4 py-3 mx-4 mt-4 rounded">
        <p className="text-[11px] font-mono font-bold text-white uppercase tracking-widest mb-1">
          Datenschutz — Keine Klarnamen mit Claude
        </p>
        <p className="text-[12px] text-white/90 leading-relaxed">
          Niemals echte Kundennamen in Ordnern, Dateinamen oder Chats verwenden. Immer den{' '}
          <strong className="text-white">Kundencode</strong> aus dem Datenkodierungs-Tool nutzen.
        </p>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-4 border-b-2 border-[#1a1a1a] flex gap-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setAktiv(t.id)}
            className={cn(
              'px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide border-2 border-b-0 relative bottom-[-2px] transition-colors',
              aktiv === t.id
                ? 'text-[#1a1a1a] bg-white border-[#1a1a1a]'
                : 'text-[#777] bg-transparent border-transparent hover:text-[#1a1a1a] hover:bg-[#f5f3ef]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="mx-4 mb-6 bg-white border-2 border-t-0 border-[#1a1a1a] p-6">

        {/* ─── STRUKTUR ─── */}
        {aktiv === 'struktur' && (
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mb-3 pb-2 border-b border-[#e0ddd8]">
              Ordnerstruktur
            </p>
            <BaumKnotenKomponente knoten={BAUM_DATEN} tiefe={0} />

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mt-6 mb-3 pb-2 border-b border-[#e0ddd8]">
              Dateiname-Schema
            </p>
            <div className="bg-[#1a1a1a] text-[#e8e6e1] font-mono text-[13px] px-4 py-3 rounded leading-relaxed">
              <span className="text-[#f59e0b]">{'{TYP}'}</span>
              <span className="text-white">_</span>
              <span className="text-[#60a5fa]">{'{JJJJ-NNNN}'}</span>
              <span className="text-white">_</span>
              <span className="text-[#34d399]">{'{CODE}'}</span>
              <span className="text-white">_</span>
              <span className="text-[#a78bfa]">{'{INFO}'}</span>
              <span className="text-white">.</span>
              <span className="text-[#f87171]">ext</span>
            </div>
            <p className="font-mono text-[11px] text-[#aaa] mt-2">
              Beispiel:{' '}
              <span className="text-[#f59e0b]">ANG</span>_
              <span className="text-[#60a5fa]">2025-0042</span>_
              <span className="text-[#34d399]">SH-C3D4</span>_
              <span className="text-[#a78bfa]">Fenster</span>.
              <span className="text-[#f87171]">pdf</span>
            </p>
          </div>
        )}

        {/* ─── TYPEN & CODES ─── */}
        {aktiv === 'typen' && (
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mb-3 pb-2 border-b border-[#e0ddd8]">
              Dokumententypen
            </p>
            <div className="grid grid-cols-2 gap-x-6">
              {DOKUMENT_TYPEN.map((t) => (
                <div key={t.code} className="flex items-center gap-3 py-1.5 border-b border-[#e0ddd8]">
                  <span className="font-mono font-bold text-[13px] w-12 shrink-0">{t.code}</span>
                  <span className="text-[13px] text-[#444]">{t.label}</span>
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mt-6 mb-3 pb-2 border-b border-[#e0ddd8]">
              Kundencodes — Präfixe
            </p>
            <div className="grid grid-cols-2 gap-x-6">
              {KUNDEN_PREFIXE.map((p) => (
                <div key={p.prefix} className="flex items-baseline gap-3 py-1.5 border-b border-[#e0ddd8]">
                  <span className="font-mono font-bold text-[14px] w-9 shrink-0">{p.prefix}</span>
                  <span className="text-[13px] text-[#444]">{p.name}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[11px] text-[#aaa] mt-3">
              Format: XX-XXXX oder XX-XXXX-XXXX &nbsp;(z.B. SH-C3D4, GW-CX9Y-QHJ7)
            </p>
          </div>
        )}

        {/* ─── WORKFLOWS ─── */}
        {aktiv === 'workflows' && (
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mb-3 pb-2 border-b border-[#e0ddd8]">
              Was kann ich Claude sagen?
            </p>
            <div className="space-y-0">
              {WORKFLOWS.map((wf) => (
                <div key={wf.nr} className="py-4 border-b border-[#e0ddd8] last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[22px] font-bold text-[#aaa] w-8 shrink-0">{wf.nr}</span>
                    <span className="text-[14px] font-bold text-[#1a1a1a]">{wf.title}</span>
                  </div>
                  <div className="ml-11">
                    <code className="inline-block font-mono text-[11px] bg-[#f0eeea] border border-[#d5d0c8] px-3 py-1.5 text-[#1a1a1a] mb-1.5">
                      {wf.beispiel}
                    </code>
                    <p className="text-[12px] text-[#777]">{wf.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mt-5 mb-3 pb-2 border-b border-[#e0ddd8]">
              Beispiel-Dialog
            </p>
            <div className="border border-[#e0ddd8] divide-y divide-[#e0ddd8] text-[12px]">
              {[
                { role: 'Du', text: 'Neuer Kunde, Code ist ', code: 'SH-F8G2', user: true },
                { role: 'Claude', text: '✓ Ordner angelegt: ', code: 'Kunden/2026_SH-F8G2/', user: false },
                { role: 'Du', text: 'Leg das Angebot 2026-0001 ab', user: true },
                { role: 'Claude', text: '✓ Gespeichert: ', code: 'Kunden/2026_SH-F8G2/ANG_2026-0001_SH-F8G2.pdf', user: false },
                { role: 'Du', text: 'Wo ist die Rechnung für ', code: 'SH-F8G2', text2: '?', user: true },
                { role: 'Claude', code: 'Kunden/2026_SH-F8G2/RE_2026-0001_SH-F8G2.pdf', user: false },
              ].map((line, i) => (
                <div key={i} className="flex gap-3 px-3 py-2">
                  <span className={cn('font-mono font-bold text-[10px] uppercase w-12 shrink-0 pt-0.5', line.user ? 'text-[#1a1a1a]' : 'text-[#777]')}>
                    {line.role}
                  </span>
                  <span className="text-[#444] flex-1">
                    {line.text}
                    {line.code && (
                      <code className="font-mono text-[0.9em] font-semibold bg-[#f0eeea] border border-[#d5d0c8] px-1">
                        {line.code}
                      </code>
                    )}
                    {(line as { text2?: string }).text2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── HILFE ─── */}
        {aktiv === 'hilfe' && (
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mb-3 pb-2 border-b border-[#e0ddd8]">
              Wenn etwas schiefgeht
            </p>
            <div className="space-y-0">
              {FEHLER_HILFE.map((f) => (
                <div key={f.problem} className="grid grid-cols-2 gap-4 py-2.5 border-b border-[#e0ddd8] text-[12px]">
                  <span className="font-medium text-[#1a1a1a]">{f.problem}</span>
                  <span className="text-[#777]">{f.loesung}</span>
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mt-5 mb-3 pb-2 border-b border-[#e0ddd8]">
              Regeln
            </p>
            <ul className="text-[13px] text-[#444] space-y-1.5">
              {REGELN.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="text-[#aaa] shrink-0">—</span>
                  {r}
                </li>
              ))}
            </ul>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mt-5 mb-3 pb-2 border-b border-[#e0ddd8]">
              Dateiname testen
            </p>
            <div className="bg-[#f0eeea] border border-[#d5d0c8] p-4">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[#777] mb-2">
                Dateiname eingeben
              </label>
              <input
                type="text"
                value={dateiname}
                onChange={(e) => setDateiname(e.target.value)}
                placeholder="z.B. ANG_2025-0042_SH-C3D4_Fenster.pdf"
                className={cn(
                  'w-full font-mono text-[13px] px-3 py-2 border-2 bg-white outline-none transition-colors',
                  !dateiname
                    ? 'border-[#c5c0b8]'
                    : validierung.ok
                      ? 'border-[#16a34a]'
                      : 'border-[#c0392b]',
                )}
              />
              {dateiname && (
                <p className={cn('font-mono text-[11px] mt-2', validierung.ok ? 'text-[#16a34a]' : 'text-[#c0392b]')}>
                  {validierung.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
