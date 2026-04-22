'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Copy, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getAppTypKonfiguration } from '@/lib/automationen/app-typen';
import type { AutomatisierungsKnoten } from '@/types';

export interface CanvasKnotenData {
  knoten: AutomatisierungsKnoten;
  onEdit: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  istGewaehlt: boolean;
}

interface CanvasKnotenProps {
  data: CanvasKnotenData;
}

/** Inline-Copy-Button ohne externe Abhängigkeit, damit die Karte schlank bleibt. */
function KopierenZeile({
  promptText,
  usesDatenkodierung,
}: {
  promptText: string;
  usesDatenkodierung: boolean;
}): React.JSX.Element {
  const [kopiert, setKopiert] = useState(false);

  const handleKopieren = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = promptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  return (
    <button
      onClick={handleKopieren}
      className={cn(
        'w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium',
        'transition-colors duration-150',
        kopiert
          ? 'text-green-700 bg-green-50'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
        usesDatenkodierung && !kopiert && 'text-[#c96442] hover:text-[#c96442]'
      )}
      title={usesDatenkodierung ? 'Prompt mit Datenkodierung kopieren' : 'Prompt kopieren'}
    >
      {kopiert ? (
        <Check className="h-3 w-3 text-green-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 shrink-0" />
      )}
      {kopiert ? 'Kopiert!' : usesDatenkodierung ? 'Prompt (kodiert)' : 'Prompt kopieren'}
    </button>
  );
}

/**
 * Kompakter n8n-inspirierter Node für den Automatisierungs-Canvas.
 * Icon-fokussiert, farblich eindeutig, minimal Text.
 */
export function CanvasKnoten({ data }: CanvasKnotenProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const { knoten, onEdit, onAddChild, onDelete, istGewaehlt } = data;
  const istBlattknoten = knoten.prompt_template !== null;
  const config = getAppTypKonfiguration(knoten.app_type);
  const Icon = config.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="relative cursor-default"
      style={{ width: 160 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Handles – visuell unsichtbar, technisch nötig für Edges */}
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden', left: -4 }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden', right: -4 }} />

      <div
        className={cn(
          'overflow-hidden rounded-xl border bg-card',
          'transition-shadow duration-150',
          istGewaehlt ? 'shadow-lg' : 'shadow-sm hover:shadow-md',
        )}
        style={{
          borderColor: istGewaehlt ? config.farbe : 'hsl(var(--border))',
          outline: istGewaehlt ? `2px solid ${config.farbe}55` : undefined,
          outlineOffset: 1,
        }}
      >
        {/* Icon-Header mit App-Farbe als Hintergrund */}
        <div
          className="flex flex-col items-center justify-center gap-1.5 px-3 pt-3.5 pb-2.5"
          style={{ backgroundColor: config.helleFarbe }}
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: config.farbe }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Text-Bereich */}
        <div className="px-3 pt-2 pb-2.5 bg-card text-center">
          <p className="text-[12px] font-semibold text-foreground leading-tight line-clamp-2">
            {knoten.title}
          </p>
          <p className="mt-0.5 text-[10px] font-medium" style={{ color: config.farbe }}>
            {config.bezeichnung}
          </p>
        </div>

        {/* Prompt-Kopieren – nur bei Blattknoten */}
        {istBlattknoten && knoten.prompt_template && (
          <div className="border-t border-border/60 bg-card">
            <KopierenZeile
              promptText={knoten.prompt_template}
              usesDatenkodierung={knoten.use_datenkodierung}
            />
          </div>
        )}
      </div>

      {/* Hover-Aktionsleiste */}
      {hovered && (
        <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[11px] text-muted-foreground shadow-sm hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Bearbeiten
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[11px] text-muted-foreground shadow-sm hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[11px] text-destructive shadow-sm hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
