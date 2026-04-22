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
  useNodesInitialized,
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
import { berechneDagreLayout } from '@/lib/automationen/dagre-layout';
import { knotenZuFlowFormat, miniMapFarbe } from '@/lib/automationen/flow-format';
import { useCreateKnoten, useUpdateKnotenPosition } from '@/hooks/use-automationen';
import type { AutomatisierungsKnoten } from '@/types';

const NODE_TYPES: NodeTypes = { canvasKnoten: CanvasKnoten };

interface FlowCanvasProps {
  knoten: AutomatisierungsKnoten[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setEditPanelOffen: (v: boolean) => void;
  onNeuerHauptbereich: () => void;
  onAutoLayout: () => void;
  onAddChild: (parentId: string) => void;
}

/**
 * Innere Canvas-Komponente — hat Zugriff auf useReactFlow via ReactFlowProvider.
 * Triggert Dagre-Layout + fitView sobald Nodes gemessen sind.
 */
function FlowCanvas({
  knoten,
  selectedId,
  setSelectedId,
  setEditPanelOffen,
  onNeuerHauptbereich,
  onAutoLayout,
  onAddChild,
}: FlowCanvasProps): React.JSX.Element {
  const { mutate: updatePosition } = useUpdateKnotenPosition();
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes: setRFNodes, fitView } = useReactFlow();
  const lastLayoutNonce = useRef<string>('');

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
    () => knotenZuFlowFormat(knoten, selectedId, handleEdit, handleAddChild, handleDelete),
    [knoten, selectedId, handleEdit, handleAddChild, handleDelete]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);

  useEffect(() => {
    setNodes(derivedNodes);
    setEdges(derivedEdges);
  }, [derivedNodes, derivedEdges, setNodes, setEdges]);

  // Layout + fitView: läuft wenn ein Node bei (0,0) liegt oder sich die
  // Baumstruktur geändert hat. Manuell positionierte Nodes werden bei
  // Dagre-Run mit-angepasst damit der Baum insgesamt konsistent bleibt.
  useEffect(() => {
    if (!nodesInitialized || knoten.length === 0) return;

    const unpositioniert = knoten.some(
      (k) => k.position_x === 0 && k.position_y === 0
    );
    const nonce = knoten
      .map((k) => `${k.id}:${k.position_x}:${k.position_y}`)
      .sort()
      .join('|');
    if (nonce === lastLayoutNonce.current) return;
    lastLayoutNonce.current = nonce;

    if (unpositioniert) {
      const laidOut = berechneDagreLayout(getNodes(), getEdges());
      setRFNodes(laidOut);
    }

    window.setTimeout(() => {
      fitView({
        padding: 0.15,
        maxZoom: 1.0,
        minZoom: 0.4,
        duration: 400,
      });
    }, 50);
  }, [nodesInitialized, knoten, getNodes, getEdges, setRFNodes, fitView]);

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
            return miniMapFarbe(d?.knoten?.app_type ?? 'generic');
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

  const handleAddChild = useCallback(
    (parentId: string): void => {
      const eltern = knoten.find((k) => k.id === parentId);
      const geschwister = knoten.filter((k) => k.parent_id === parentId);
      createKnoten(
        {
          parent_id: parentId,
          title: 'Neuer Knoten',
          description: null,
          app_type: eltern?.app_type ?? 'generic',
          prompt_template: null,
          gdrive_path: null,
          position_x: 0,
          position_y: 0,
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
    [knoten, createKnoten]
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
        position_y: 0,
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
