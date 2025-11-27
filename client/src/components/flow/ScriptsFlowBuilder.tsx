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
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Save, Plus, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

// Import custom nodes
import StartNode from '@/components/flow/StartNode';
import FormInputNode from '@/components/flow/FormInputNode';
import BotKnowledgeNode from '@/components/flow/BotKnowledgeNode';
import EndNode from '@/components/flow/EndNode';
import FormInputConfigModal from '@/components/flow/FormInputConfigModal';

const nodeTypes: NodeTypes = {
    startNode: StartNode,
    formInputNode: FormInputNode,
    botKnowledgeNode: BotKnowledgeNode,
    endNode: EndNode,
};

const initialNodes: Node[] = [
    {
        id: 'start-1',
        type: 'startNode',
        position: { x: 250, y: 50 },
        data: { label: 'Start' },
    },
];

const initialEdges: Edge[] = [];

interface ScriptsFlowBuilderProps {
    workspaceId: string;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
}

function ScriptsFlowBuilderInner({ workspaceId, isFullScreen, onToggleFullScreen }: ScriptsFlowBuilderProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
                data:
                    type === 'formInputNode'
                        ? {
                            label: 'Input Node',
                            inputType: 'text',
                            questionText: 'Please enter your response',
                            emoji: '',
                            isBold: false,
                            isRequired: true,
                        }
                        : {
                            label:
                                type === 'startNode'
                                    ? 'Start'
                                    : type === 'botKnowledgeNode'
                                        ? 'Bot Knowledge'
                                        : 'End',
                        },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            setSelectedNode(node);
            if (node.type === 'formInputNode') {
                setShowConfigModal(true);
            }
        },
        []
    );

    const handleNodeUpdate = (data: any) => {
        if (selectedNode) {
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === selectedNode.id ? { ...node, data: { ...node.data, ...data } } : node
                )
            );
        }
    };

    const handleDeleteSelected = useCallback(() => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
            setEdges((eds) =>
                eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
            );
            setSelectedNode(null);
            toast({
                title: 'Node Deleted',
                description: 'The selected node has been removed.',
            });
        }
    }, [selectedNode, setNodes, setEdges, toast]);

    // Load existing flow on component mount
    useEffect(() => {
        const loadFlow = async () => {
            try {
                const response = await apiClient.get(`/api/script/${workspaceId}/flow`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.flow && reactFlowInstance) {
                        const { nodes: loadedNodes, edges: loadedEdges } = data.flow;
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

        if (workspaceId && reactFlowInstance) {
            loadFlow();
        }
    }, [workspaceId, reactFlowInstance, setNodes, setEdges]);

    const saveFlow = async () => {
        if (!reactFlowInstance) return;

        const flow = reactFlowInstance.toObject();
        try {
            const response = await apiClient.post(`/api/script/${workspaceId}/flow`, { flow });

            if (response.ok) {
                toast({
                    title: 'Flow Saved',
                    description: 'Your workflow has been saved successfully.',
                });
            } else {
                throw new Error('Failed to save flow');
            }
        } catch (error) {
            toast({
                title: 'Save Failed',
                description: 'Failed to save the flow. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div
            className={`${isFullScreen ? 'fixed inset-0 z-50' : 'relative'
                } bg-slate-900 flex flex-col transition-all duration-300`}
            style={{ height: isFullScreen ? '100vh' : '600px' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-700">
                <div className="flex items-center gap-4">
                    <h2 className="text-base font-semibold text-slate-200">Flow Builder</h2>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        {nodes.length} nodes • {edges.length} connections
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {selectedNode && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="border-slate-700 text-slate-300 hover:bg-red-900/20 hover:text-red-400"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <Button onClick={saveFlow} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Save Flow
                    </Button>
                    <Button
                        onClick={onToggleFullScreen}
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        {isFullScreen ? (
                            <>
                                <Minimize2 className="h-4 w-4 mr-2" />
                                Exit
                            </>
                        ) : (
                            <>
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Fullscreen
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Node Palette */}
                <aside className="w-[280px] bg-slate-800 border-r border-slate-800 overflow-y-auto">
                    {/* Search */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-slate-700 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Components */}
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center">
                            <span className="mr-2">⊟</span>
                            Components
                        </h3>
                        
                        {/* Input / Output Section */}
                        <div className="mb-4">
                            <button className="flex items-center gap-2 text-sm text-slate-300 mb-2 hover:text-white w-full">
                                <span className="text-pink-400">🗂️</span>
                                <span className="font-medium">Input / Output</span>
                                <span className="ml-auto text-slate-500">▼</span>
                            </button>
                            <div className="ml-6 space-y-2">
                                <ComponentItem
                                    icon="💬"
                                    label="Chat Input"
                                    type="startNode"
                                />
                                <ComponentItem
                                    icon="💬"
                                    label="Chat Output"
                                    type="endNode"
                                />
                                <ComponentItem
                                    icon="T"
                                    label="Text Input"
                                    type="formInputNode"
                                />
                                <ComponentItem
                                    icon="T"
                                    label="Text Output"
                                    type="endNode"
                                />
                            </div>
                        </div>

                        {/* Models Section */}
                        <div className="mb-4">
                            <button className="flex items-center gap-2 text-sm text-slate-300 mb-2 hover:text-white w-full">
                                <span className="text-green-400">🧠</span>
                                <span className="font-medium">Models</span>
                                <span className="ml-auto text-slate-500">▶</span>
                            </button>
                            <div className="ml-6 space-y-2">
                                <ComponentItem
                                    icon="⚡"
                                    label="Language Model"
                                    type="botKnowledgeNode"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Discover More */}
                    <div className="p-4 border-t border-slate-800">
                        <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                            <span>🧩</span>
                            <span>Discover more components</span>
                        </button>
                    </div>
                </aside>

                {/* Flow Canvas */}
                <div className="flex-1 bg-slate-900" ref={reactFlowWrapper}>
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
                        className="bg-slate-900"
                        defaultEdgeOptions={{
                            style: { stroke: '#4b5563', strokeWidth: 2 },
                            type: 'smoothstep',
                        }}
                    >
                        <Controls className="!bg-slate-700 !border-slate-700" />
                        <MiniMap
                            className="!bg-slate-700 !border !border-slate-700"
                            nodeColor={() => '#1a1f2e'}
                            maskColor="rgba(10, 14, 20, 0.6)"
                        />
                        <Background 
                            variant={BackgroundVariant.Dots} 
                            gap={20} 
                            size={1} 
                            color="#1f2937" 
                        />
                        <Panel position="bottom-right" className="bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-400">
                            {nodes.length} nodes • {edges.length} edges • 71%
                        </Panel>
                    </ReactFlow>
                </div>
            </div>

            {/* Configuration Modal */}
            <FormInputConfigModal
                open={showConfigModal}
                onOpenChange={setShowConfigModal}
                initialData={selectedNode?.data}
                onSave={handleNodeUpdate}
            />
        </div>
    );
}

export default function ScriptsFlowBuilder(props: ScriptsFlowBuilderProps) {
    return (
        <ReactFlowProvider>
            <ScriptsFlowBuilderInner {...props} />
        </ReactFlowProvider>
    );
}

// Component Item for sidebar
function ComponentItem({ icon, label, type }: { icon: string; label: string; type: string }) {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded cursor-grab active:cursor-grabbing transition-colors group"
            onDragStart={(event) => onDragStart(event, type)}
            draggable
        >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
            <button className="ml-auto text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100">
                ⋮
            </button>
        </div>
    );
}
