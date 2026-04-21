'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
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

const NODE_TYPES: NodeTypes = {
  canvasKnoten: CanvasKnoten,
};

interface AutomatisierungenCanvasProps {
  knoten: AutomatisierungsKnoten[];
}

/** Berechnet initiale Baumlayout-Positionen für Knoten ohne gespeicherte Position. */
function berechneAutoLayout(knoten: AutomatisierungsKnoten[]): Map<string, { x: number; y: number }> {
  const positionen = new Map<string, { x: number; y: number }>();
  const knotenOhnePos = knoten.filter((k) => k.position_x === 0 && k.position_y === 0);
  if (knotenOhnePos.length === 0) return positionen;

  const childrenMap = new Map<string | null, AutomatisierungsKnoten[]>();
  for (const k of knoten) {
    const key = k.parent_id;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(k);
  }

  let yOffset = 0;
  function platziere(parentId: string | null, tiefe: number): void {
    const kinder = (childrenMap.get(parentId) ?? []).sort((a, b) => a.position - b.position);
    for (const k of kinder) {
      if (k.position_x === 0 && k.position_y === 0) {
        positionen.set(k.id, { x: tiefe * 300, y: yOffset * 120 });
        yOffset++;
      }
      platziere(k.id, tiefe + 1);
    }
  }
  platziere(null, 0);
  return positionen;
}

/** Wandelt flache Knoten-Liste in React Flow Nodes + Edges um. */
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
      position: {
        x: auto?.x ?? k.position_x,
        y: auto?.y ?? k.position_y,
      },
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
      style: { stroke: '#d1cfc5', strokeWidth: 2 },
    }));

  return { nodes, edges };
}

/**
 * Interaktiver Automatisierungs-Canvas mit React Flow.
 * Nodes können frei verschoben werden; Positionen werden in Supabase persistiert.
 */
export function AutomatisierungenCanvas({
  knoten,
}: AutomatisierungenCanvasProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPanelOffen, setEditPanelOffen] = useState(false);

  const { mutate: createKnoten } = useCreateKnoten();
  const { mutate: updatePosition } = useUpdateKnotenPosition();

  const autoLayout = useMemo(() => berechneAutoLayout(knoten), [knoten]);

  const handleEdit = useCallback((id: string): void => {
    setSelectedId(id);
    setEditPanelOffen(true);
  }, []);

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
          position_x: elternPos.x + 300,
          position_y: elternPos.y + geschwister.length * 120,
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

  const handleDelete = useCallback(
    (id: string): void => {
      if (selectedId === id) {
        setSelectedId(null);
        setEditPanelOffen(false);
      }
    },
    [selectedId]
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
        position_y: wurzeln.length * 200,
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

  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(
    () =>
      knotenZuFlowFormat(
        knoten,
        autoLayout,
        selectedId,
        handleEdit,
        handleAddChild,
        handleDelete
      ),
    [knoten, autoLayout, selectedId, handleEdit, handleAddChild, handleDelete]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);

  // Nodes und Edges bei Datenänderungen synchronisieren
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

  const selectedKnoten = knoten.find((k) => k.id === selectedId) ?? null;

  return (
    <div className="relative h-full w-full">
      {/* Canvas Toolbar */}
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 bg-card shadow-sm"
          onClick={handleNeuerHauptbereich}
        >
          <Plus className="h-3.5 w-3.5" />
          Hauptbereich
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 bg-card/80 shadow-sm hover:bg-card"
          onClick={handleAutoLayout}
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
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1cfc5"
        />
        <Controls
          showInteractive={false}
          className="!shadow-sm !border !border-border !rounded-lg overflow-hidden"
        />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as unknown as CanvasKnotenData;
            return d?.knoten?.app_type === 'generic' ? '#e8e6dc' : '#c96442';
          }}
          maskColor="rgba(245, 244, 237, 0.8)"
          className="!border !border-border !rounded-lg !shadow-sm"
        />
      </ReactFlow>

      {/* Eigenschaften-Panel */}
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
