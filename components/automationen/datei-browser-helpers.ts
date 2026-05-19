import type { OrdnerEintrag, DateiTyp } from '@/lib/automationen/ordner-struktur';
import { SEEHAFER_STRUKTUR } from '@/lib/automationen/ordner-struktur';

export const STORAGE_KEY = 'seehafer-struktur-v1';
export type AusgabeFormat = 'pdf' | 'word' | 'excel' | 'scan' | null;

export const TYPE_OPTIONEN: { type: DateiTyp; logo: string; label: string }[] = [
  { type: 'folder', logo: 'google-drive.png', label: 'Ordner' },
  { type: 'docx', logo: 'word.png', label: 'Word' },
  { type: 'sheet', logo: 'excel.png', label: 'Excel' },
  { type: 'pdf', logo: 'pdf.png', label: 'PDF' },
  { type: 'template', logo: 'word.png', label: 'Vorlage' },
];

export interface Baustein {
  id: string;
  name: string;
  type: DateiTyp;
  logo?: string;
  pfad: string;
  kontext: string;
}

// ── Tree helpers ──────────────────────────────────────────────────────────────

export function aktualisiereEintrag(
  baum: OrdnerEintrag,
  id: string,
  delta: Partial<OrdnerEintrag>,
): OrdnerEintrag {
  if (baum.id === id) return { ...baum, ...delta };
  if (!baum.kinder?.length) return baum;
  return { ...baum, kinder: baum.kinder.map((k) => aktualisiereEintrag(k, id, delta)) };
}

export function fuegeKindHinzu(
  baum: OrdnerEintrag,
  elternId: string,
  kind: OrdnerEintrag,
): OrdnerEintrag {
  if (baum.id === elternId) return { ...baum, kinder: [...(baum.kinder ?? []), kind] };
  if (!baum.kinder?.length) return baum;
  return { ...baum, kinder: baum.kinder.map((k) => fuegeKindHinzu(k, elternId, kind)) };
}

export function loescheAus(baum: OrdnerEintrag, id: string): OrdnerEintrag {
  return {
    ...baum,
    kinder: (baum.kinder ?? []).filter((k) => k.id !== id).map((k) => loescheAus(k, id)),
  };
}

export function ladeStruktur(): OrdnerEintrag {
  if (typeof window === 'undefined') return SEEHAFER_STRUKTUR;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as OrdnerEintrag) : SEEHAFER_STRUKTUR;
  } catch {
    return SEEHAFER_STRUKTUR;
  }
}

export function sucheName(id: string, baum: OrdnerEintrag): string | null {
  if (baum.id === id) return baum.name;
  for (const kind of baum.kinder ?? []) {
    const found = sucheName(id, kind);
    if (found !== null) return found;
  }
  return null;
}
