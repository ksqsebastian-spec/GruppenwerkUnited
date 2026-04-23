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

function KopierenPille({
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
        'mt-1.5 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
        'transition-colors duration-150 shadow-sm',
        kopiert
          ? 'border-green-300 bg-green-50 text-green-700'
          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60',
        usesDatenkodierung && !kopiert && 'border-[#c96442]/30 text-[#c96442]'
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
 * n8n-style Node: horizontale Karte mit Icon links, Titel + App-Typ rechts.
 */
export function CanvasKnoten({ data }: CanvasKnotenProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const { knoten, onEdit, onAddChild, onDelete, istGewaehlt } = data;
  const istBlattknoten = knoten.prompt_template !== null;
  const config = getAppTypKonfiguration(knoten.app_type);
  const Logo = config.Logo;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="relative flex flex-col items-center cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* n8n-style horizontale Karte */}
      <div
        className={cn(
          'relative flex items-center gap-3 w-52 px-3 py-2.5 rounded-xl bg-white',
          'shadow-sm transition-all duration-150',
          istGewaehlt ? 'shadow-md' : 'hover:shadow-md',
        )}
        style={{
          border: `1.5px solid ${istGewaehlt ? config.farbe : config.farbe + '55'}`,
          boxShadow: istGewaehlt
            ? `0 0 0 3px ${config.farbe}22, 0 2px 8px rgba(0,0,0,0.08)`
            : undefined,
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ top: '50%', left: -5, visibility: 'hidden' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ top: '50%', right: -5, visibility: 'hidden' }}
        />

        {/* App-Icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: config.helleFarbe }}
        >
          <Logo size={22} />
        </div>

        {/* Titel + Typ */}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-foreground leading-tight truncate">
            {knoten.title}
          </p>
          <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: config.farbe }}>
            {config.bezeichnung}
          </p>
        </div>
      </div>

      {/* Kopier-Pille nur für Blatt-Nodes */}
      {istBlattknoten && knoten.prompt_template && (
        <KopierenPille
          promptText={knoten.prompt_template}
          usesDatenkodierung={knoten.use_datenkodierung}
        />
      )}

      {/* Hover-Aktionsleiste */}
      {hovered && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 z-10 whitespace-nowrap">
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
            title="Kind-Knoten hinzufügen"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[11px] text-destructive shadow-sm hover:bg-destructive/10 transition-colors"
            title="Löschen"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
