'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { PromptKopierenButton } from './prompt-kopieren-button';
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

/**
 * Großes, farblich eindeutiges Node-Card für den Automatisierungs-Canvas.
 * Zeigt App-Icon, Titel, optionale Beschreibung und bei Leaf-Nodes den Prompt-Button.
 * Action-Buttons (Bearbeiten, Kind, Löschen) erscheinen beim Hover.
 */
export function CanvasKnoten({ data }: CanvasKnotenProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const { knoten, onEdit, onAddChild, onDelete, istGewaehlt } = data;
  const istBlattknoten = knoten.prompt_template !== null;
  const config = getAppTypKonfiguration(knoten.app_type);
  const Icon = config.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative bg-card rounded-xl border-2 shadow-sm cursor-default',
        'w-[220px] min-h-[80px]',
        'transition-shadow duration-150',
        istGewaehlt
          ? 'shadow-lg'
          : 'shadow-sm hover:shadow-md',
      )}
      style={{
        borderColor: istGewaehlt ? config.farbe : 'hsl(var(--border))',
        boxShadow: istGewaehlt
          ? `0 0 0 2px ${config.farbe}33, 0 4px 16px ${config.farbe}22`
          : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Farbiger Akzent-Balken oben */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-[10px]"
        style={{ backgroundColor: config.farbe }}
      />

      {/* React Flow Connection Handles (visuell unsichtbar) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: 'hidden', left: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: 'hidden', right: -4 }}
      />

      {/* Karten-Inhalt */}
      <div className="px-3.5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* App-Typ Icon */}
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: config.helleFarbe }}
          >
            <Icon className="h-5 w-5" style={{ color: config.farbe }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {knoten.title}
            </p>
            {knoten.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-snug line-clamp-2">
                {knoten.description}
              </p>
            )}
            {/* App-Typ Badge */}
            <p
              className="mt-1 text-[10px] font-medium"
              style={{ color: config.farbe }}
            >
              {config.bezeichnung}
            </p>
          </div>
        </div>

        {/* GDrive-Pfad */}
        {istBlattknoten && knoten.gdrive_path && (
          <p className="mt-2 truncate text-[10px] text-muted-foreground/60 font-mono bg-muted/40 rounded px-1.5 py-0.5">
            {knoten.gdrive_path}
          </p>
        )}

        {/* Prompt-Kopieren-Button für Leaf-Nodes */}
        {istBlattknoten && knoten.prompt_template && (
          <PromptKopierenButton
            promptText={knoten.prompt_template}
            usesDatenkodierung={knoten.use_datenkodierung}
          />
        )}
      </div>

      {/* Hover-Action-Leiste */}
      {hovered && (
        <div className="absolute -bottom-9 left-0 right-0 flex justify-center gap-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-xs text-muted-foreground shadow-sm hover:text-foreground hover:bg-muted transition-colors"
            title="Bearbeiten"
          >
            <Pencil className="h-3 w-3" />
            Bearbeiten
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-xs text-muted-foreground shadow-sm hover:text-foreground hover:bg-muted transition-colors"
            title="Kind-Knoten hinzufügen"
          >
            <Plus className="h-3 w-3" />
            Kind
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(knoten.id); }}
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-xs text-destructive shadow-sm hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Löschen"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
