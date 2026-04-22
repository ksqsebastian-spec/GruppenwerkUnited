import type { Node, Edge } from '@xyflow/react';
import type { AutomatisierungsKnoten } from '@/types';

/** App-Typ → MiniMap-Farbe. Gleiche Palette wie `app-typen.ts#farbe`. */
const MINIMAP_FARBEN: Record<string, string> = {
  gdrive: '#10B981',
  outlook: '#0078D4',
  email: '#0078D4',
  sheets: '#34A853',
  word: '#2B579A',
  claude: '#c96442',
  ai: '#c96442',
  pdf: '#EA4335',
};

/** Wandelt flache Knoten-Liste in React Flow Nodes + Edges um. */
export function knotenZuFlowFormat(
  knoten: AutomatisierungsKnoten[],
  selectedId: string | null,
  onEdit: (id: string) => void,
  onAddChild: (parentId: string) => void,
  onDelete: (id: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = knoten.map((k) => ({
    id: k.id,
    type: 'canvasKnoten',
    position: { x: k.position_x, y: k.position_y },
    data: {
      knoten: k,
      onEdit,
      onAddChild,
      onDelete,
      istGewaehlt: selectedId === k.id,
    } as unknown as Record<string, unknown>,
  }));

  const edges: Edge[] = knoten
    .filter((k) => k.parent_id !== null)
    .map((k) => ({
      id: `e-${k.parent_id}-${k.id}`,
      source: k.parent_id!,
      target: k.id,
      type: 'bezier',
      animated: false,
      style: { stroke: '#a8a59a', strokeWidth: 1.5 },
    }));

  return { nodes, edges };
}

/** Gibt die MiniMap-Farbe für einen App-Typ zurück. */
export function miniMapFarbe(appType: string): string {
  return MINIMAP_FARBEN[appType] ?? '#87867f';
}
