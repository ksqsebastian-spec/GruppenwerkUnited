'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasKnoten, type CanvasKnotenData } from './canvas-knoten';
import { KnotenEditPanel } from './knoten-edit-panel';
import { useCreateKnoten, useUpdateKnotenPosition } from '@/hooks/use-automationen';
import type { AutomatisierungsKnoten } from '@/types';

const NODE_TYPES: NodeTypes = { canvasKnoten: CanvasKnoten };
const NODE_WIDTH = 240;
const NODE_H_GAP = 300; // horizontaler Abstand zwischen Ebenen
const NODE_V_GAP = 160; // vertikaler Abstand zwischen Blatt-Knoten

/**
 * Reingold-Tilford-artiges Baumlayout.
 * Blatt-Knoten bekommen aufsteigende Y-Positionen.
 * Eltern-Knoten werden vertikal auf den Mittelpunkt ihrer Kinder gesetzt.
 * Ergebnis: Root-Knoten ist immer vertikal zentriert.
 */
function berechneAutoLayout(knoten: AutomatisierungsKnoten[]): Map<string, { x: number; y: number }> {
  const knotenOhnePos = knoten.filter((k) => k.position_x === 0 && k.position_y === 0);
  if (knotenOhnePos.length === 0) return new Map();

  const childrenMap = new Map<string | null, AutomatisierungsKnoten[]>();
  for (const k of knoten) {
    if (!childrenMap.has(k.parent_id)) childrenMap.set(k.parent_id, []);
    childrenMap.get(k.parent_id)!.push(k);
  }
  for (const [, children] of childrenMap) {
    children.sort((a, b) => a.position - b.position);
  }

  const positionen = new Map<string, { x: number; y: number }>();
  let leafY = 0;

  function assign(id: string, depth: number): number {
    const kinder = childrenMap.get(id) ?? [];
    if (kinder.length === 0) {
      const y = leafY * NODE_V_GAP;
      leafY++;
      positionen.set(id, { x: depth * NODE_H_GAP, y });
      return y;
    }
    const childYs = kinder.map((k) => {
      if (k.position_x === 0 && k.position_y === 0) {
        return assign(k.id, depth + 1);
      }
      return k.position_y;
    });
    const centerY = (childYs[0] + childYs[childYs.length - 1]) / 2;
    positionen.set(id, { x: depth * NODE_H_GAP, y: centerY });
    return centerY;
  }

  const roots = (childrenMap.get(null) ?? []).sort((a, b) => a.position - b.position);
  for (const root of roots) {
    if (root.position_x === 0 && root.position_y === 0) {
      assign(root.id, 0);
    }
  }

  return positionen;
}

/** Wandelt flache Liste in React Flow Nodes + Edges um. */
function knotenZuFlowFormat(
  knoten: AutomatisierungsKnoten[],
  autoLayout: Map<string, { x: number; y: number }>,
  selectedId: string | null,
  onEdit: (id: string) => void,
  onAddChild: (parentId: string) => void,
  onDelete: (id: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = knoten.map((k) => {
    const auto = autoLayout.get(k.id);
    return {
      id: k.id,
      type: 'canvasKnoten',
      position: { x: auto?.x ?? k.position_x, y: auto?.y ?? k.position_y },
      data: {
        knoten: k,
        onEdit,
        onAddChild,
        onDelete,
        istGewaehlt: selectedId === k.id,
      } as unknown as Record<string, unknown>,
    };
  });

  const edges: Edge[] = knoten
    .filter((k) => k.parent_id !== null)
    .map((k) => ({
      id: `e-${k.parent_id}-${k.id}`,
      source: k.parent_id!,
      target: k.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#c5c2b8', strokeWidth: 2 },
    }));

  return { nodes, edges };
}

/**
 * Null-Komponente die als Kind von ReactFlow läuft.
 * Setzt den initialen Viewport so dass der Root-Knoten links-mittig sichtbar ist,
 * mit einem Zoom-Level das alle Nodes lesbar macht.
 */
function ViewportInit({
  knoten,
  autoLayout,
}: {
  knoten: AutomatisierungsKnoten[];
  autoLayout: Map<string, { x: number; y: number }>;
}): null {
  const { fitView, setViewport } = useReactFlow();
  const initialisiert = useRef(false);

  useEffect(() => {
    if (initialisiert.current || knoten.length === 0) return;
    initialisiert.current = true;

    setTimeout(() => {
      const roots = knoten.filter((k) => k.parent_id === null);
      if (roots.length === 0) {
        fitView({ padding: 0.2, duration: 500, maxZoom: 1.2 });
        return;
      }

      // Root-Knoten-Position bestimmen
      const root = roots[0];
      const rootPos = autoLayout.get(root.id) ?? { x: root.position_x, y: root.position_y };

      // Viewport so setzen: Root links-mittig mit gutem Zoom
      const ZOOM = 0.85;
      const viewportHeight = window.innerHeight;
      setViewport(
        {
          x: 80, // Root hat etwas Abstand vom linken Rand
          y: viewportHeight / 2 - (rootPos.y + 50) * ZOOM,
          zoom: ZOOM,
        },
        { duration: 400 }
      );
    }, 80);
  }, [knoten, autoLayout, fitView, setViewport]);

  return null;
}

interface FlowCanvasProps {
  knoten: AutomatisierungsKnoten[];
  autoLayout: Map<string, { x: number; y: number }>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setEditPanelOffen: (v: boolean) => void;
  onNeuerHauptbereich: () => void;
  onAutoLayout: () => void;
  onAddChild: (parentId: string) => void;
}

/**
 * Innere Canvas-Komponente — hat Zugriff auf useReactFlow via ReactFlowProvider.
 */
function FlowCanvas({
  knoten,
  autoLayout,
  selectedId,
  setSelectedId,
  setEditPanelOffen,
  onNeuerHauptbereich,
  onAutoLayout,
  onAddChild,
}: FlowCanvasProps): React.JSX.Element {
  const { mutate: updatePosition } = useUpdateKnotenPosition();

  const handleEdit = useCallback(
    (id: string): void => {
      setSelectedId(id);
      setEditPanelOffen(true);
    },
    [setSelectedId, setEditPanelOffen]
  );

  const handleAddChild = useCallback(
    (parentId: string): void => {
      onAddChild(parentId);
    },
    [onAddChild]
  );

  const handleDelete = useCallback(
    (id: string): void => {
      if (selectedId === id) {
        setSelectedId(null);
        setEditPanelOffen(false);
      }
    },
    [selectedId, setSelectedId, setEditPanelOffen]
  );

  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(
    () =>
      knotenZuFlowFormat(knoten, autoLayout, selectedId, handleEdit, handleAddChild, handleDelete),
    [knoten, autoLayout, selectedId, handleEdit, handleAddChild, handleDelete]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);

  useEffect(() => {
    setNodes(derivedNodes);
    setEdges(derivedEdges);
  }, [derivedNodes, derivedEdges, setNodes, setEdges]);

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      updatePosition({ id: node.id, x: node.position.x, y: node.position.y });
    },
    [updatePosition]
  );

  return (
    <>
      {/* Canvas Toolbar */}
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 bg-card shadow-sm"
          onClick={onNeuerHauptbereich}
        >
          <Plus className="h-3.5 w-3.5" />
          Hauptbereich
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 bg-card/80 shadow-sm hover:bg-card"
          onClick={onAutoLayout}
          title="Knotenpositionen zurücksetzen"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Auto-Layout
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_event, node) => handleEdit(node.id)}
        nodeTypes={NODE_TYPES}
        nodeOrigin={[0, 0.5]}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <ViewportInit knoten={knoten} autoLayout={autoLayout} />

        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#cac8be"
        />
        <Controls
          showInteractive={false}
          className="!shadow-sm !border !border-border !rounded-lg overflow-hidden"
        />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as unknown as CanvasKnotenData;
            const typ = d?.knoten?.app_type;
            const farben: Record<string, string> = {
              gdrive: '#10B981', outlook: '#0078D4', email: '#0078D4',
              sheets: '#34A853', word: '#2B579A', claude: '#c96442',
              ai: '#c96442', pdf: '#EA4335',
            };
            return farben[typ] ?? '#87867f';
          }}
          nodeStrokeWidth={0}
          maskColor="rgba(245, 244, 237, 0.85)"
          className="!border !border-border !rounded-lg !shadow-sm"
        />
      </ReactFlow>
    </>
  );
}

interface AutomatisierungenCanvasProps {
  knoten: AutomatisierungsKnoten[];
}

/**
 * Interaktiver Automatisierungs-Canvas.
 * Wrapper stellt ReactFlowProvider bereit; Zustand wird hier verwaltet.
 */
export function AutomatisierungenCanvas({ knoten }: AutomatisierungenCanvasProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPanelOffen, setEditPanelOffen] = useState(false);

  const { mutate: createKnoten } = useCreateKnoten();
  const { mutate: updatePosition } = useUpdateKnotenPosition();

  const autoLayout = useMemo(() => berechneAutoLayout(knoten), [knoten]);

  const handleAddChild = useCallback(
    (parentId: string): void => {
      const eltern = knoten.find((k) => k.id === parentId);
      const geschwister = knoten.filter((k) => k.parent_id === parentId);
      const elternPos = autoLayout.get(parentId) ?? {
        x: eltern?.position_x ?? 0,
        y: eltern?.position_y ?? 0,
      };
      createKnoten(
        {
          parent_id: parentId,
          title: 'Neuer Knoten',
          description: null,
          app_type: eltern?.app_type ?? 'generic',
          prompt_template: null,
          gdrive_path: null,
          position_x: elternPos.x + NODE_H_GAP,
          position_y: elternPos.y + geschwister.length * NODE_V_GAP,
          position: geschwister.length,
          use_datenkodierung: false,
          is_active: true,
        },
        {
          onSuccess: (neuerKnoten: AutomatisierungsKnoten) => {
            setSelectedId(neuerKnoten.id);
            setEditPanelOffen(true);
          },
        }
      );
    },
    [knoten, autoLayout, createKnoten]
  );

  const handleNeuerHauptbereich = useCallback((): void => {
    const wurzeln = knoten.filter((k) => k.parent_id === null);
    createKnoten(
      {
        parent_id: null,
        title: 'Neuer Bereich',
        description: null,
        app_type: 'generic',
        prompt_template: null,
        gdrive_path: null,
        position_x: 0,
        position_y: wurzeln.length * (NODE_V_GAP * 3),
        position: wurzeln.length,
        use_datenkodierung: false,
        is_active: true,
      },
      {
        onSuccess: (neuerKnoten: AutomatisierungsKnoten) => {
          setSelectedId(neuerKnoten.id);
          setEditPanelOffen(true);
        },
      }
    );
  }, [knoten, createKnoten]);

  const handleAutoLayout = useCallback((): void => {
    for (const k of knoten) {
      updatePosition({ id: k.id, x: 0, y: 0 });
    }
  }, [knoten, updatePosition]);

  const selectedKnoten = knoten.find((k) => k.id === selectedId) ?? null;

  return (
    <div className="relative h-full w-full">
      <ReactFlowProvider>
        <FlowCanvas
          knoten={knoten}
          autoLayout={autoLayout}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setEditPanelOffen={setEditPanelOffen}
          onNeuerHauptbereich={handleNeuerHauptbereich}
          onAutoLayout={handleAutoLayout}
          onAddChild={handleAddChild}
        />
      </ReactFlowProvider>

      <KnotenEditPanel
        knoten={selectedKnoten}
        offen={editPanelOffen}
        onSchliessen={() => {
          setEditPanelOffen(false);
          setSelectedId(null);
        }}
      />
    </div>
  );
}
