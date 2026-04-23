import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const DEFAULT_WIDTH = 256;
const DEFAULT_HEIGHT = 60;

/**
 * Layoutet sichtbare Nodes vertikal (TB) mit Dagre.
 * Versteckte Nodes (hidden=true) werden nicht layoutet – ihre Position bleibt.
 *
 * nodeOrigin={[0, 0.5]}: position.x = linker Rand, position.y = vertikaler Mittelpunkt.
 * Dagre liefert Mittelpunkte → x: center - width/2, y: center (unverändert).
 */
export function berechneDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const sichtbareNodes = nodes.filter((n) => !n.hidden);
  const sichtbareIds = new Set(sichtbareNodes.map((n) => n.id));
  const sichtbareEdges = edges.filter(
    (e) => sichtbareIds.has(e.source) && sichtbareIds.has(e.target)
  );

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,   // horizontaler Abstand zwischen Geschwistern
    ranksep: 60,   // vertikaler Abstand zwischen Ebenen
    marginx: 20,
    marginy: 20,
  });

  sichtbareEdges.forEach((e) => g.setEdge(e.source, e.target));
  sichtbareNodes.forEach((n) => {
    g.setNode(n.id, {
      width: n.measured?.width ?? DEFAULT_WIDTH,
      height: n.measured?.height ?? DEFAULT_HEIGHT,
    });
  });

  Dagre.layout(g);

  const posMap = new Map<string, { x: number; y: number }>();
  sichtbareNodes.forEach((n) => {
    const pos = g.node(n.id);
    const w = n.measured?.width ?? DEFAULT_WIDTH;
    posMap.set(n.id, { x: pos.x - w / 2, y: pos.y });
  });

  return nodes.map((n) => ({
    ...n,
    position: posMap.has(n.id) ? posMap.get(n.id)! : n.position,
  }));
}
