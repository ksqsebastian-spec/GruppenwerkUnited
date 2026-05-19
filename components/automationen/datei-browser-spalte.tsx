'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrdnerEintrag, DateiTyp } from '@/lib/automationen/ordner-struktur';
import { DateiIcon } from './datei-browser-icon';
import { TYPE_OPTIONEN } from './datei-browser-helpers';

interface SpalteZeileProps {
  eintrag: OrdnerEintrag;
  aktiv: boolean;
  autoEdit: boolean;
  onKlick: () => void;
  onSpeichern: (id: string, name: string, kontext: string, type: DateiTyp, logo: string) => void;
  onLoeschen: (id: string) => void;
}

function SpalteZeile({
  eintrag,
  aktiv,
  autoEdit,
  onKlick,
  onSpeichern,
  onLoeschen,
}: SpalteZeileProps): React.JSX.Element {
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
        <div className="flex gap-1 mb-1.5">
          {TYPE_OPTIONEN.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setEditType(opt.type);
                setEditLogo(opt.logo);
              }}
              title={opt.label}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg border transition-colors',
                editType === opt.type ? 'border-[#3b82f6] bg-white' : 'border-transparent hover:bg-white',
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') speichern();
            if (e.key === 'Escape') abbrechen();
          }}
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
          <button
            onClick={speichern}
            className="flex-1 text-[10px] font-semibold bg-[#000000] text-white rounded-lg py-1 hover:bg-[#262626] transition-colors"
          >
            Speichern
          </button>
          <button
            onClick={abbrechen}
            className="flex-1 text-[10px] font-medium text-[#737373] bg-white border border-[#e5e5e5] rounded-lg py-1 hover:bg-[#f0f0f0] transition-colors"
          >
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
        <DateiIcon
          type={eintrag.type}
          logo={aktiv ? undefined : eintrag.logo}
          className={cn('h-4 w-4', aktiv && 'text-white')}
        />
        <span className="text-[12px] font-medium truncate flex-1">{eintrag.name}</span>
        {eintrag.type === 'folder' && (eintrag.kinder?.length ?? 0) > 0 && (
          <ChevronRight className={cn('h-3 w-3 shrink-0', aktiv ? 'text-white' : 'text-[#a3a3a3]')} />
        )}
      </button>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditMode(true);
          }}
          className="h-5 w-5 flex items-center justify-center rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#e5e5e5] transition-colors"
          title="Bearbeiten"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoeschen(eintrag.id);
          }}
          className="h-5 w-5 flex items-center justify-center rounded text-[#a3a3a3] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
          title="Löschen"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

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

export function Spalte({
  eintraege,
  aktivId,
  elternId,
  neuEintragId,
  onKlick,
  onSpeichern,
  onLoeschen,
  onHinzufuegen,
}: SpalteProps): React.JSX.Element {
  return (
    <div className="flex-shrink-0 w-52 h-full border-r border-[#e5e5e5] overflow-y-auto flex flex-col">
      <button
        onClick={() => onHinzufuegen(elternId)}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors border-b border-[#f0f0f0]"
      >
        <Plus className="h-3 w-3" />
        Hinzufügen
      </button>
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
    </div>
  );
}
