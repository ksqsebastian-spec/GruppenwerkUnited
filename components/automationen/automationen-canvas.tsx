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
  type NodeTypes,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
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
  onAddChild: (parentId: string) => void;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
}

function FlowCanvas({
  knoten,
  selectedId,
  setSelectedId,
  setEditPanelOffen,
  onNeuerHauptbereich,
  onAddChild,
  collapsedIds,
  onToggleCollapse,
}: FlowCanvasProps): React.JSX.Element {
  const { mutate: updatePosition } = useUpdateKnotenPosition();
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes: setRFNodes, fitView } = useReactFlow();
  const lastLayoutNonce = useRef<string>('');

  const handleEdit = useCallback(
    (id: string): void => { setSelectedId(id); setEditPanelOffen(true); },
    [setSelectedId, setEditPanelOffen]
  );

  const handleAddChild = useCallback(
    (parentId: string): void => { onAddChild(parentId); },
    [onAddChild]
  );

  const handleDelete = useCallback(
    (id: string): void => {
      if (selectedId === id) { setSelectedId(null); setEditPanelOffen(false); }
    },
    [selectedId, setSelectedId, setEditPanelOffen]
  );

  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(
    () => knotenZuFlowFormat(
      knoten, selectedId, collapsedIds,
      handleEdit, handleAddChild, handleDelete, onToggleCollapse
    ),
    [knoten, selectedId, collapsedIds, handleEdit, handleAddChild, handleDelete, onToggleCollapse]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);

  // Sync: Positionen beibehalten, hidden-Flag + Daten aktualisieren
  useEffect(() => {
    setNodes((current) => {
      const posMap = new Map(current.map((n) => [n.id, n.position]));
      return derivedNodes.map((n) => ({ ...n, position: posMap.get(n.id) ?? n.position }));
    });
    setEdges(derivedEdges);
  }, [derivedNodes, derivedEdges, setNodes, setEdges]);

  // Layout + fitView: bei strukturellen Änderungen UND Kollabier-Änderungen
  useEffect(() => {
    if (!nodesInitialized || knoten.length === 0) return;
    const nonce =
      knoten.map((k) => k.id).sort().join('|') +
      '|c:' + [...collapsedIds].sort().join(',');
    if (nonce === lastLayoutNonce.current) return;
    lastLayoutNonce.current = nonce;

    const laidOut = berechneDagreLayout(getNodes(), getEdges());
    setRFNodes(laidOut);

    window.setTimeout(() => {
      fitView({ padding: 0.12, maxZoom: 0.9, minZoom: 0.15, duration: 400 });
    }, 80);
  }, [nodesInitialized, knoten, collapsedIds, getNodes, getEdges, setRFNodes, fitView]);

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      updatePosition({ id: node.id, x: node.position.x, y: node.position.y });
    },
    [updatePosition]
  );

  return (
    <>
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card shadow-sm" onClick={onNeuerHauptbereich}>
          <Plus className="h-3.5 w-3.5" />
          Hauptbereich
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
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#cac8be" />
        <Controls showInteractive={false} className="!shadow-sm !border !border-border !rounded-lg overflow-hidden" />
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

export function AutomatisierungenCanvas({ knoten }: AutomatisierungenCanvasProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPanelOffen, setEditPanelOffen] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const { mutate: createKnoten } = useCreateKnoten();

  const handleToggleCollapse = useCallback((id: string): void => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
        { onSuccess: (neuerKnoten: AutomatisierungsKnoten) => { setSelectedId(neuerKnoten.id); setEditPanelOffen(true); } }
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
      { onSuccess: (neuerKnoten: AutomatisierungsKnoten) => { setSelectedId(neuerKnoten.id); setEditPanelOffen(true); } }
    );
  }, [knoten, createKnoten]);

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
          onAddChild={handleAddChild}
          collapsedIds={collapsedIds}
          onToggleCollapse={handleToggleCollapse}
        />
      </ReactFlowProvider>
      <KnotenEditPanel
        knoten={selectedKnoten}
        offen={editPanelOffen}
        onSchliessen={() => { setEditPanelOffen(false); setSelectedId(null); }}
      />
    </div>
  );
}
