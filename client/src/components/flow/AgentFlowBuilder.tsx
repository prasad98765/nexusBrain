import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Connection,
    useNodesState,
    useEdgesState,
    Background,
    BackgroundVariant,
    NodeTypes,
    ReactFlowProvider,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Save, Minimize2, Maximize2, ZoomIn, ZoomOut, Maximize, Lock, Unlock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

// Import custom nodes
import ButtonNode from '@/components/flow/MessageNode';
import AINode from '@/components/flow/AINode';
import InputNode from '@/components/flow/InputNode';
import ApiLibraryNode from '@/components/flow/ApiLibraryNode';
import KnowledgeBaseNode from '@/components/flow/KnowledgeBaseNode';
import EngineNode from '@/components/flow/EngineNode';
import NodeConfigPanel from '@/components/flow/NodeConfigPanel';
import AgentPreviewPanel from '@/components/flow/AgentPreviewPanel';

const nodeTypes: NodeTypes = {
    button: ButtonNode,
    message: ButtonNode, // Support legacy 'message' type
    ai: AINode,
    input: InputNode,
    apiLibrary: ApiLibraryNode,
    knowledgeBase: KnowledgeBaseNode,
    engine: EngineNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface AgentFlowBuilderProps {
    agentId: string;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
}

function AgentFlowBuilderInner({ agentId, isFullScreen, onToggleFullScreen }: AgentFlowBuilderProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [editingNode, setEditingNode] = useState<{ id: string; type: 'button' | 'input' | 'ai' | 'apiLibrary' | 'knowledgeBase' } | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const onConnect = useCallback(
        (params: Connection) => {
            // Determine edge style based on connection type
            let edgeStyle = { stroke: '#4b5563', strokeWidth: 2 };
            let animated = true;
            
            // If connecting to Language Model's Knowledge Base input (id: 'input')
            if (params.targetHandle === 'input') {
                edgeStyle = { stroke: '#6366f1', strokeWidth: 2 }; // Indigo color for KB connections
                animated = true;
            }
            
            setEdges((eds) => addEdge({ 
                ...params, 
                type: 'smoothstep', 
                animated,
                style: edgeStyle
            }, eds));
        },
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
                    type === 'button' || type === 'message'
                        ? {
                            label: 'Interactive Node',
                            message: 'What would you like to choose?',
                            buttons: [],
                        }
                        : type === 'input'
                            ? {
                                label: 'User Input',
                                inputType: 'text',
                                placeholder: 'Enter your response',
                                required: false,
                            }
                            : type === 'ai'
                                ? {
                                    label: 'Language Model',
                                    model: 'meta-llama/llama-3.3-8b-instruct:free',
                                    maxTokens: 300,
                                    temperature: 0.7,
                                    systemPrompt: '',
                                }
                                : type === 'engine'
                                    ? {
                                        label: 'Engine',
                                    }
                                : type === 'apiLibrary'
                                    ? {
                                        label: 'API Library',
                                        apiLibraryId: null,
                                        apiName: '',
                                        apiMethod: '',
                                    }
                                    : type === 'knowledgeBase'
                                        ? {
                                            label: 'Knowledge Base',
                                            selectedDocuments: [],
                                            documentCount: 0,
                                        }
                                        : {},
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    // Event listeners for node actions
    useEffect(() => {
        const handleDeleteNode = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId } = event.detail;
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) =>
                eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
            );
            toast({ title: 'Node Deleted', description: 'Node has been removed from the flow.' });
        };

        const handleDuplicateNode = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId } = event.detail;
            const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
            if (nodeToDuplicate) {
                const newNode = {
                    ...nodeToDuplicate,
                    id: `${nodeToDuplicate.type}-${Date.now()}`,
                    position: {
                        x: nodeToDuplicate.position.x + 50,
                        y: nodeToDuplicate.position.y + 50,
                    },
                };
                setNodes((nds) => [...nds, newNode]);
                toast({ title: 'Node Duplicated', description: 'Node has been duplicated successfully.' });
            }
        };

        const handleToggleNodeMinimize = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId, isMinimized } = event.detail;
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === nodeId ? { ...node, data: { ...node.data, isMinimized } } : node
                )
            );
        };

        const handleEditNode = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId, type } = event.detail;

            // Always open/switch to the node's configuration panel
            setEditingNode({ id: nodeId, type });

            // Auto-switch to full-screen mode if not already in full-screen
            if (!isFullScreen) {
                onToggleFullScreen();
            }
        };

        const handleUpdateNodeLabel = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId, label } = event.detail;
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
                )
            );
        };

        window.addEventListener('deleteNode', handleDeleteNode);
        window.addEventListener('duplicateNode', handleDuplicateNode);
        window.addEventListener('toggleNodeMinimize', handleToggleNodeMinimize);
        window.addEventListener('editNode', handleEditNode);
        window.addEventListener('updateNodeLabel', handleUpdateNodeLabel);

        return () => {
            window.removeEventListener('deleteNode', handleDeleteNode);
            window.removeEventListener('duplicateNode', handleDuplicateNode);
            window.removeEventListener('toggleNodeMinimize', handleToggleNodeMinimize);
            window.removeEventListener('editNode', handleEditNode);
            window.removeEventListener('updateNodeLabel', handleUpdateNodeLabel);
        };
    }, [nodes, setNodes, setEdges, toast, isFullScreen, onToggleFullScreen]);

    // Load existing flow from flow agent
    useEffect(() => {
        const loadFlow = async () => {
            try {
                const response = await apiClient.get(`/api/flow-agents/${agentId}`);
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
    }, [agentId, reactFlowInstance, setNodes, setEdges]);

    const saveFlow = async () => {
        if (!reactFlowInstance) return;

        const flow = reactFlowInstance.toObject();
        try {
            const response = await apiClient.patch(`/api/flow-agents/${agentId}/flow`, {
                flowData: flow
            });

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

    const handleSaveNodeConfig = (data: any) => {
        if (!editingNode) return;

        setNodes((nds) =>
            nds.map((node) =>
                node.id === editingNode.id ? { ...node, data: { ...node.data, ...data } } : node
            )
        );
    };

    // Custom control functions
    const handleZoomIn = () => {
        if (reactFlowInstance) {
            reactFlowInstance.zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (reactFlowInstance) {
            reactFlowInstance.zoomOut();
        }
    };

    const handleFitView = () => {
        if (reactFlowInstance) {
            reactFlowInstance.fitView({ padding: 0.2 });
        }
    };

    return (
        <div
            className={`${isFullScreen ? 'fixed inset-0 z-50' : 'relative'
                } bg-[#0a0e14] flex flex-col transition-all duration-300`}
            style={{ height: isFullScreen ? '100vh' : '700px' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b  /50">
                <div className="flex items-center gap-4">
                    <h2 className="text-base font-semibold text-gray-200">Flow Builder</h2>
                    <span className="text-xs text-gray-500  px-2 py-1 rounded">
                        {nodes.length} nodes • {edges.length} connections
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => setShowPreview(true)} 
                        size="sm" 
                        variant="outline"
                        className="border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 hover:text-indigo-300"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                    <Button onClick={saveFlow} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                    <Button
                        onClick={onToggleFullScreen}
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                <aside className="w-[280px]  border-r  overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-200 mb-4">Node Types</h3>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 px-2">Input/Output</h4>
                                <div className="space-y-1">
                                    <ComponentItem label="Interactive Node" type="button" />
                                    <ComponentItem label="Input Node" type="input" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 px-2">Processing</h4>
                                <div className="space-y-1">
                                    <ComponentItem label="Language Model" type="ai" />
                                    <ComponentItem label="Engine" type="engine" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 px-2">Integration</h4>
                                <div className="space-y-1">
                                    <ComponentItem label="API Library" type="apiLibrary" />
                                    <ComponentItem label="Knowledge Base" type="knowledgeBase" />
                                </div>
                            </div>
                        </div>
                    </div>

                </aside>

                {/* Flow Canvas */}
                <div className="flex-1 " ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        nodesDraggable={!isLocked}
                        nodesConnectable={!isLocked}
                        elementsSelectable={!isLocked}
                        fitView
                        className=""
                        defaultEdgeOptions={{
                            style: { stroke: '#4b5563', strokeWidth: 2 },
                            type: 'smoothstep',
                        }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2937" />

                        {/* Custom Controls Panel */}
                        <Panel position="bottom-left" className="flex gap-2 mb-4 ml-4">
                            <div className="flex items-center gap-1  border  rounded-lg p-1 shadow-lg">
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleFitView}
                                    className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
                                    title="Fit View"
                                >
                                    <Maximize className="h-4 w-4" />
                                </button>
                                <div className="w-px h-6 bg-gray-700" />
                                <button
                                    onClick={() => setIsLocked(!isLocked)}
                                    className={`p-2 rounded transition-colors ${isLocked
                                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                        : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                                        }`}
                                    title={isLocked ? 'Unlock Canvas' : 'Lock Canvas'}
                                >
                                    {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                </button>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>
            </div>

            {/* Node Configuration Panel */}
            {editingNode && (
                <NodeConfigPanel
                    nodeId={editingNode.id}
                    nodeType={editingNode.type}
                    nodeData={nodes.find((n) => n.id === editingNode.id)?.data}
                    onClose={() => setEditingNode(null)}
                    onSave={handleSaveNodeConfig}
                />
            )}

            {/* Agent Preview Panel */}
            {showPreview && (
                <AgentPreviewPanel
                    agentId={agentId}
                    agentName={`Flow Agent ${agentId.substring(0, 8)}`}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}

export default function AgentFlowBuilder(props: AgentFlowBuilderProps) {
    return (
        <ReactFlowProvider>
            <AgentFlowBuilderInner {...props} />
        </ReactFlowProvider>
    );
}

// Component Item for sidebar
function ComponentItem({ label, type }: { label: string; type: string }) {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className="px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1a1f2e] rounded cursor-grab active:cursor-grabbing transition-colors border-l-2 border-transparent hover:border-blue-500"
            onDragStart={(event) => onDragStart(event, type)}
            draggable
        >
            <span className="font-medium">{label}</span>
        </div>
    );
}
