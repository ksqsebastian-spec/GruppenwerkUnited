import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

/**
 * Fallback-Dimensionen falls React Flow die Node noch nicht gemessen hat.
 * 80px Icon-Box + ~64px Caption (Titel + Typ + optionale Kopier-Pille).
 */
const DEFAULT_WIDTH = 128;
const DEFAULT_HEIGHT = 150;

/**
 * Layoutet einen Node-Graphen mit Dagre (links-nach-rechts, hierarchisch).
 * Verwendet die tatsächlich gerenderten Dimensionen (`node.measured`) sobald
 * React Flow die Nodes einmal gemessen hat – dadurch keine Überlappungen
 * unabhängig von Blatt- vs Kategorie-Höhenunterschieden.
 *
 * React Flow verwendet in dieser App `nodeOrigin={[0, 0.5]}`:
 * → Position.x = linker Rand, Position.y = vertikaler Mittelpunkt.
 * Dagre liefert den Mittelpunkt → wir ziehen Breite/2 ab.
 */
export function berechneDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 40,
    ranksep: 140,
    marginx: 20,
    marginy: 20,
  });

  edges.forEach((e) => g.setEdge(e.source, e.target));

  nodes.forEach((n) => {
    g.setNode(n.id, {
      width: n.measured?.width ?? DEFAULT_WIDTH,
      height: n.measured?.height ?? DEFAULT_HEIGHT,
    });
  });

  Dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    const w = n.measured?.width ?? DEFAULT_WIDTH;
    return {
      ...n,
      position: {
        x: pos.x - w / 2,
        y: pos.y,
      },
    };
  });
}
