import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import api from '../../api/client';
import useAutoLayout from './hooks/useAutoLayout';
import TriggerNode from './components/TriggerNode';
import ActionNode from './components/ActionNode';
import BranchNode from './components/BranchNode';
import Sidebar from './components/Sidebar';
import ConfigPanel from './components/ConfigPanel';
import { ArrowLeftIcon, CloudArrowUpIcon, PlayIcon } from '@heroicons/react/24/outline';

// ─── Custom Node Registration ────────────────────────────────
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  branch: BranchNode,
};

// ─── Default Edge Style ─────────────────────────────────────
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#3f3f46', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46', width: 16, height: 16 },
};

// ─── Initial Trigger Node ───────────────────────────────────
const INITIAL_NODES = [
  {
    id: 'trigger_1',
    type: 'trigger',
    position: { x: 0, y: 0 },
    data: { triggerType: 'conversation_opened', description: '' },
  },
];

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLayoutedElements } = useAutoLayout();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const nodeCounter = useRef(1);

  // ─── Load Workflow ────────────────────────────────────
  useEffect(() => {
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/workflows/${id}`);
        const workflow = data.workflow;
        if (!workflow) return;
        
        setWorkflowName(workflow.name || 'Untitled Workflow');
        
        if (workflow.steps) {
          const graph = typeof workflow.steps === 'string' ? JSON.parse(workflow.steps) : workflow.steps;
          if (graph.nodes?.length) setNodes(graph.nodes);
          if (graph.edges?.length) setEdges(graph.edges);
          nodeCounter.current = graph.nodes?.length || 1;
        }
      } catch (err) {
        console.error('[WorkflowBuilder] Load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ─── Connect Nodes ─────────────────────────────────────
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
  }, [setEdges]);

  // ─── Node Click → Config Panel ────────────────────────
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ─── Add Node from Sidebar ────────────────────────────
  const handleAddNode = useCallback((actionType) => {
    nodeCounter.current += 1;
    const newId = `step_${nodeCounter.current}_${Date.now()}`;

    const isBranch = actionType === 'branch';
    const newNode = {
      id: newId,
      type: isBranch ? 'branch' : 'action',
      position: { x: 0, y: nodes.length * 150 },
      data: {
        actionType,
        label: '',
        summary: '',
        config: {},
        ...(isBranch && {
          branches: [
            { id: `${newId}_b1`, label: 'Branch 1', conditions: [] },
            { id: `${newId}_b2`, label: 'Branch 2', conditions: [] },
          ],
        }),
      },
    };

    // Auto-connect to the last node
    const lastNode = nodes[nodes.length - 1];
    const newEdge = lastNode
      ? {
          id: `e_${lastNode.id}_${newId}`,
          source: lastNode.id,
          target: newId,
          ...defaultEdgeOptions,
        }
      : null;

    setNodes((nds) => {
      const updated = [...nds, newNode];
      const updatedEdges = newEdge ? [...edges, newEdge] : edges;
      const { nodes: layouted } = getLayoutedElements(updated, updatedEdges);
      return layouted;
    });

    if (newEdge) {
      setEdges((eds) => [...eds, newEdge]);
    }

    // Select the new node
    setSelectedNode(newNode);
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges]);

  // ─── Update Node Data ─────────────────────────────────
  const handleUpdateNode = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, ...updates } };
      })
    );
    // Update selected node ref
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...updates } } : prev));
  }, [setNodes]);

  // ─── Delete Node ──────────────────────────────────────
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // ─── Auto-Layout ──────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layouted);
    setEdges(layoutedEdges);
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges]);

  // ─── Save Workflow ────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const graph = { nodes, edges };
      const triggerNode = nodes.find((n) => n.type === 'trigger');
      const payload = {
        name: workflowName,
        triggerType: triggerNode?.data?.triggerType || 'manual',
        graph,
        steps: JSON.stringify(graph),
      };

      if (id && id !== 'new') {
        await api.put(`/workflows/${id}`, payload);
      } else {
        const { data } = await api.post('/workflows', payload);
        navigate(`/workflows/${data.id}`, { replace: true });
      }
    } catch (err) {
      console.error('[WorkflowBuilder] Save error:', err);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflowName, id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <div className="text-zinc-500 text-sm">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#09090b] overflow-hidden">
      {/* Left Sidebar — Node Palette */}
      <Sidebar onAddNode={handleAddNode} />

      {/* Center — Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          className="!bg-[#09090b]"
        >
          <Background color="#1a1a1e" gap={20} size={1} />
          <Controls
            className="!bg-zinc-900 !border-zinc-800 !rounded-xl !shadow-2xl [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800"
            position="bottom-left"
          />

          {/* Top Bar inside canvas */}
          <Panel position="top-left" className="flex items-center gap-3">
            <button
              onClick={() => navigate('/workflows')}
              className="p-2 rounded-xl bg-zinc-900/90 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-xl"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-zinc-900/90 border border-white/5 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-200 outline-none focus:border-indigo-500/30 backdrop-blur-xl w-[240px]"
            />
          </Panel>

          <Panel position="top-right" className="flex items-center gap-2">
            <button
              onClick={handleAutoLayout}
              className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-xl"
            >
              Auto Layout
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Panel — Config */}
      {selectedNode && (
        <ConfigPanel
          node={selectedNode}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
