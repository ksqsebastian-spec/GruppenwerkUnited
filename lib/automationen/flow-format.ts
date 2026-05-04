import type { Node, Edge } from '@xyflow/react';
import type { AutomatisierungsKnoten } from '@/types';
import { getAppTypKonfiguration } from './app-typen';

const MINIMAP_FARBEN: Record<string, string> = {
  gdrive: '#4285F4',
  outlook: '#0078D4',
  email: '#EA4335',
  sheets: '#34A853',
  word: '#2B579A',
  claude: '#D97757',
  ai: '#D97757',
  pdf: '#EA4335',
};

/** Berechnet alle Nachfahren der kollabierten Knoten (rekursiv). */
function berechneVersteckteIds(
  collapsedIds: Set<string>,
  knoten: AutomatisierungsKnoten[]
): Set<string> {
  const hidden = new Set<string>();
  const queue = [...collapsedIds];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const k of knoten) {
      if (k.parent_id === parentId && !hidden.has(k.id)) {
        hidden.add(k.id);
        queue.push(k.id);
      }
    }
  }
  return hidden;
}

/** Wandelt flache Knoten-Liste in React Flow Nodes + Edges um. */
export function knotenZuFlowFormat(
  knoten: AutomatisierungsKnoten[],
  selectedId: string | null,
  collapsedIds: Set<string>,
  onEdit: (id: string) => void,
  onAddChild: (parentId: string) => void,
  onDelete: (id: string) => void,
  onToggleCollapse: (id: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const hiddenIds = berechneVersteckteIds(collapsedIds, knoten);

  // Anzahl direkter Kinder pro Knoten (für "N verborgen"-Badge)
  const kinderAnzahl = new Map<string, number>();
  for (const k of knoten) {
    if (k.parent_id !== null) {
      kinderAnzahl.set(k.parent_id, (kinderAnzahl.get(k.parent_id) ?? 0) + 1);
    }
  }

  // Anzahl versteckter Nachfahren pro kollabiertem Knoten
  const versteckteNachfahrenAnzahl = new Map<string, number>();
  for (const id of collapsedIds) {
    let count = 0;
    const queue = [id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const k of knoten) {
        if (k.parent_id === cur) {
          count++;
          queue.push(k.id);
        }
      }
    }
    versteckteNachfahrenAnzahl.set(id, count);
  }

  const nodes: Node[] = knoten.map((k) => ({
    id: k.id,
    type: 'canvasKnoten',
    position: { x: k.position_x, y: k.position_y },
    hidden: hiddenIds.has(k.id),
    data: {
      knoten: k,
      onEdit,
      onAddChild,
      onDelete,
      onToggleCollapse,
      istGewaehlt: selectedId === k.id,
      hasChildren: (kinderAnzahl.get(k.id) ?? 0) > 0,
      isCollapsed: collapsedIds.has(k.id),
      hiddenChildCount: versteckteNachfahrenAnzahl.get(k.id) ?? 0,
    } as unknown as Record<string, unknown>,
  }));

  const edges: Edge[] = knoten
    .filter((k) => k.parent_id !== null && !hiddenIds.has(k.id))
    .map((k) => {
      const farbe = getAppTypKonfiguration(k.app_type).farbe;
      return {
        id: `e-${k.parent_id}-${k.id}`,
        source: k.parent_id!,
        target: k.id,
        type: 'bezier',
        animated: false,
        style: { stroke: farbe, strokeWidth: 2 },
      };
    });

  return { nodes, edges };
}

export function miniMapFarbe(appType: string): string {
  return MINIMAP_FARBEN[appType] ?? '#87867f';
}
