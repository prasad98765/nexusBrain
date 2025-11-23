import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StartNode from '@/components/flow/StartNode';
import InputNode from '@/components/flow/InputNode';
import BotKnowledgeNode from '@/components/flow/BotKnowledgeNode';
import EndNode from '@/components/flow/EndNode';
import BotKnowledgeModal from '@/components/flow/BotKnowledgeModal';
import { useAuth } from '@/hooks/useAuth';

const nodeTypes: NodeTypes = {
  startNode: StartNode,
  inputNode: InputNode,
  botKnowledgeNode: BotKnowledgeNode,
  endNode: EndNode,
};

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'startNode',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
];

const initialEdges: Edge[] = [];

interface FlowBuilderProps {
  agentId: string;
  onBackClick: () => void;
}

function FlowBuilderInner({ agentId, onBackClick }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedKnowledgeNode, setSelectedKnowledgeNode] = useState<string | null>(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { toast } = useToast();
  const { user, token } = useAuth();
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: any) => addEdge(params, eds)),
    [setEdges]
  );
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type === 'startNode' ? 'Start' :
            type === 'inputNode' ? 'User Input' :
              type === 'botKnowledgeNode' ? 'Bot Knowledge' :
                'End'
        },
      };

      setNodes((nds: any) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === 'botKnowledgeNode') {
        setSelectedKnowledgeNode(node.id);
        setShowKnowledgeModal(true);
      }
    },
    []
  );

  // Load existing flow on component mount
  useEffect(() => {
    const loadFlow = async () => {
      try {
        const response = await fetch(`/api/flow-agents/${agentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.flowData && reactFlowInstance) {
            const { nodes: loadedNodes, edges: loadedEdges } = data.flowData;
            if (loadedNodes?.length > 0) {
              setNodes(loadedNodes);
              setEdges(loadedEdges || []);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load flow:', error);
      }
    };

    if (agentId && reactFlowInstance) {
      loadFlow();
    }
  }, [agentId, reactFlowInstance, setNodes, setEdges, token]);

  const saveFlow = async () => {
    if (!reactFlowInstance) return;

    const flow = reactFlowInstance.toObject();
    try {
      const response = await fetch(`/api/flow-agents/${agentId}/flow`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ flowData: flow }),
      });

      if (response.ok) {
        toast({
          title: 'Flow saved',
          description: 'Your agent flow has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save flow');
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save the flow. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agent
          </Button> */}
          <h1 className="text-xl font-bold text-slate-100">Flow Builder</h1>
        </div>
        <Button onClick={saveFlow} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="h-4 w-4 mr-2" />
          Save Flow
        </Button>
      </div>

      <div className="flex flex-1">
        {/* Node Palette */}
        <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Drag nodes to canvas</h3>
          <div className="space-y-3">
            <DragNode type="startNode" label="Start Node" color="bg-green-500" />
            <DragNode type="inputNode" label="Input Node" color="bg-blue-500" />
            <DragNode type="botKnowledgeNode" label="Bot Knowledge" color="bg-purple-500" />
            <DragNode type="endNode" label="End Node" color="bg-red-500" />
          </div>
        </aside>

        {/* Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            {/* <Controls /> */}
            {/* <MiniMap /> */}
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Bot Knowledge Modal */}
      <BotKnowledgeModal
        open={showKnowledgeModal}
        onOpenChange={setShowKnowledgeModal}
        nodeId={selectedKnowledgeNode}
        onUpdate={(data) => {
          if (selectedKnowledgeNode) {
            setNodes((nds: any) =>
              nds.map((node: any) =>
                node.id === selectedKnowledgeNode
                  ? { ...node, data: { ...node.data, ...data } }
                  : node
              )
            );
          }
        }}
      />
    </div>
  );
}

export default function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}

interface DragNodeProps {
  type: string;
  label: string;
  color: string;
}

function DragNode({ type, label, color }: DragNodeProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`${color} p-3 rounded-lg cursor-grab active:cursor-grabbing text-white text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity`}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <Plus className="h-4 w-4" />
      {label}
    </div>
  );
}