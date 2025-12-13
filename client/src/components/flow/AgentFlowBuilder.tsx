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
import { Save, Minimize2, Maximize2, ZoomIn, ZoomOut, Maximize, Lock, Unlock, Eye, StickyNote, Clock, ArrowDownUp, ArrowRightLeft } from 'lucide-react';
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
import ConditionNode from '@/components/flow/ConditionNode';
import NotesNode from '@/components/flow/NotesNode';
import InteractiveListNode from '@/components/flow/InteractiveListNode';
import SimpleMessageNode from '@/components/flow/SimpleMessageNode';
import AgentNode from '@/components/flow/AgentNode';
import AgentSelectorNode from '@/components/flow/AgentSelectorNode';
import AgentConfigPanel from '@/components/flow/AgentConfigPanel';
import AgentSelectorConfigPanel from '@/components/flow/AgentSelectorConfigPanel';
import NodeConfigPanel from '@/components/flow/NodeConfigPanel';
import AgentPreviewPanel from '@/components/flow/AgentPreviewPanel';
import ConditionConfigDrawer from '@/components/flow/ConditionConfigDrawer';
import { ConditionRule, ConditionGroup } from '@/components/flow/ConditionNode';

const nodeTypes: NodeTypes = {
    button: ButtonNode,
    message: ButtonNode, // Support legacy 'message' type
    ai: AINode,
    input: InputNode,
    apiLibrary: ApiLibraryNode,
    knowledgeBase: KnowledgeBaseNode,
    engine: EngineNode,
    condition: ConditionNode,
    notes: NotesNode,
    interactiveList: InteractiveListNode,
    simpleMessage: SimpleMessageNode,
    agent: AgentNode,
    agentSelector: AgentSelectorNode,
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
    const [editingNode, setEditingNode] = useState<{ id: string; type: 'button' | 'input' | 'ai' | 'apiLibrary' | 'knowledgeBase' | 'condition' | 'interactiveList' | 'simpleMessage' } | null>(null);
    const [showAgentConfig, setShowAgentConfig] = useState(false);
    const [editingAgentNodeId, setEditingAgentNodeId] = useState<string | null>(null);
    const [showAgentSelectorConfig, setShowAgentSelectorConfig] = useState(false);
    const [editingAgentSelectorNodeId, setEditingAgentSelectorNodeId] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showConditionDrawer, setShowConditionDrawer] = useState(false);
    const [editingConditionNodeId, setEditingConditionNodeId] = useState<string | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [layoutOrientation, setLayoutOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const { toast } = useToast();
    const { user } = useAuth();

    const onConnect = useCallback(
        (params: Connection) => {
            console.log('[API LIBRARY DEBUG] New connection params:', params);

            // Determine edge style based on connection type
            let edgeStyle = { stroke: '#4b5563', strokeWidth: 2 };
            let animated = true;

            // If connecting to Language Model's Knowledge Base input (id: 'input')
            if (params.targetHandle === 'input') {
                edgeStyle = { stroke: '#6366f1', strokeWidth: 2 }; // Indigo color for KB connections
                animated = true;
            }

            const newEdge = {
                ...params,
                type: 'smoothstep',
                animated,
                style: edgeStyle
            };

            console.log('[API LIBRARY DEBUG] New edge being added:', newEdge);

            setEdges((eds) => addEdge(newEdge, eds));
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
                                    : type === 'agentSelector'
                                        ? {
                                            label: 'Agent',
                                            selectedAgentId: '',
                                            selectedAgentName: '',
                                            selectedAgentDescription: '',
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
                                                : type === 'condition'
                                                    ? {
                                                        label: 'Condition',
                                                        conditionGroups: [
                                                            {
                                                                id: `group-${Date.now()}`,
                                                                conditions: [
                                                                    {
                                                                        id: `condition-${Date.now()}`,
                                                                        variable: '',
                                                                        operator: 'equals',
                                                                        value: [],
                                                                        valueType: 'static',
                                                                        logicOperator: undefined,
                                                                    }
                                                                ],
                                                                groupLogicOperator: "OR",
                                                            }
                                                        ],
                                                    }
                                                    : type === 'notes'
                                                        ? {
                                                            content: '',
                                                            width: 250,
                                                            height: 200,
                                                        }
                                                        : type === 'interactiveList'
                                                            ? {
                                                                label: 'Interactive List',
                                                                message: 'Please select an option:',
                                                                headerText: '',
                                                                buttonListTitle: 'Options',
                                                                sections: [

                                                                ],
                                                                footer: '',
                                                            }
                                                            : type === 'simpleMessage'
                                                                ? {
                                                                    label: 'Message',
                                                                    message: '',
                                                                }
                                                                : {},
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes, nodes, toast]
    );

    // Event listeners for node actions
    useEffect(() => {
        const handleDeleteNode = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId } = event.detail;

            // Check if node is required
            const nodeToDelete = nodes.find(n => n.id === nodeId);
            if (nodeToDelete?.data?.isRequired) {
                toast({
                    title: 'Cannot Delete',
                    description: 'This node is required and cannot be deleted.',
                    variant: 'destructive'
                });
                return;
            }

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

            // For agent nodes, open the agent config panel
            if (type === 'agent') {
                setEditingAgentNodeId(nodeId);
                setShowAgentConfig(true);
                // Auto-switch to full-screen mode if not already in full-screen
                if (!isFullScreen) {
                    onToggleFullScreen();
                }
                return;
            }

            // For agent selector nodes, open the agent selector config panel
            if (type === 'agentSelector') {
                setEditingAgentSelectorNodeId(nodeId);
                setShowAgentSelectorConfig(true);
                // Auto-switch to full-screen mode if not already in full-screen
                if (!isFullScreen) {
                    onToggleFullScreen();
                }
                return;
            }

            // For condition nodes, open the condition drawer
            if (type === 'condition') {
                setEditingConditionNodeId(nodeId);
                setShowConditionDrawer(true);
                // Auto-switch to full-screen mode if not already in full-screen
                if (!isFullScreen) {
                    onToggleFullScreen();
                }
                return;
            }

            // For other nodes, open/switch to the node's configuration panel
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

        const handleUpdateNodeData = (e: Event) => {
            const event = e as CustomEvent;
            const { nodeId, data } = event.detail;
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
                )
            );
        };

        window.addEventListener('deleteNode', handleDeleteNode);
        window.addEventListener('duplicateNode', handleDuplicateNode);
        window.addEventListener('toggleNodeMinimize', handleToggleNodeMinimize);
        window.addEventListener('editNode', handleEditNode);
        window.addEventListener('updateNodeLabel', handleUpdateNodeLabel);
        window.addEventListener('updateNodeData', handleUpdateNodeData);

        return () => {
            window.removeEventListener('deleteNode', handleDeleteNode);
            window.removeEventListener('duplicateNode', handleDuplicateNode);
            window.removeEventListener('toggleNodeMinimize', handleToggleNodeMinimize);
            window.removeEventListener('editNode', handleEditNode);
            window.removeEventListener('updateNodeLabel', handleUpdateNodeLabel);
            window.removeEventListener('updateNodeData', handleUpdateNodeData);
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
    }, [agentId, reactFlowInstance, setNodes, setEdges, toast]);

    const saveFlow = async () => {
        if (!reactFlowInstance) return;

        const flow = reactFlowInstance.toObject();

        // Debug: Log all edges with their sourceHandle values
        console.log('[SAVE FLOW DEBUG] === Edges being saved ===');
        flow.edges.forEach((edge: any, idx: number) => {
            console.log(`[SAVE FLOW DEBUG] Edge #${idx}:`, {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle
            });
        });
        console.log('[SAVE FLOW DEBUG] === End edges ===');

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

    const handleSaveConditions = (data: { conditionGroups: ConditionGroup[]; hasDefaultOutput: boolean }) => {
        if (!editingConditionNodeId) return;

        setNodes((nds) =>
            nds.map((node) =>
                node.id === editingConditionNodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            conditionGroups: data.conditionGroups,
                            hasDefaultOutput: data.hasDefaultOutput,
                            conditions: undefined
                        }
                    }
                    : node
            )
        );
        setShowConditionDrawer(false);
        setEditingConditionNodeId(null);
    };

    const handleSaveAgentConfig = (config: any) => {
        if (!editingAgentNodeId) return;

        setNodes((nds) =>
            nds.map((node) =>
                node.id === editingAgentNodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            configuration: config
                        }
                    }
                    : node
            )
        );
        setShowAgentConfig(false);
        setEditingAgentNodeId(null);
    };

    const handleSaveAgentSelectorConfig = (config: any) => {
        if (!editingAgentSelectorNodeId) return;

        setNodes((nds) =>
            nds.map((node) =>
                node.id === editingAgentSelectorNodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            selectedAgentId: config.selectedAgentId,
                            selectedAgentName: config.selectedAgentName,
                            selectedAgentDescription: config.selectedAgentDescription,
                        }
                    }
                    : node
            )
        );
        setShowAgentSelectorConfig(false);
        setEditingAgentSelectorNodeId(null);
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

    const handleAddNote = () => {
        if (!reactFlowInstance) return;

        // Get center of visible viewport
        const { x, y, zoom } = reactFlowInstance.getViewport();
        const centerX = (window.innerWidth / 2 - x) / zoom;
        const centerY = (window.innerHeight / 2 - y) / zoom;

        const newNote: Node = {
            id: `notes-${Date.now()}`,
            type: 'notes',
            position: { x: centerX - 125, y: centerY - 100 }, // Center the note (250x200 default size)
            data: {
                content: '',
                width: 250,
                height: 200,
            },
        };

        setNodes((nds) => [...nds, newNote]);
        toast({
            title: 'Note Added',
            description: 'A new sticky note has been added to the canvas.',
        });
    };

    // Auto-layout nodes in hierarchical format
    const applyHierarchicalLayout = useCallback((orientation: 'horizontal' | 'vertical') => {
        if (!reactFlowInstance || nodes.length === 0) return;

        // Simple hierarchical layout algorithm
        const nodeWidth = 280;
        const nodeHeight = 150;
        const horizontalSpacing = 200;
        const verticalSpacing = 250;

        // Find entry node (node with no incoming edges)
        const entryNode = nodes.find(node => {
            return !edges.some(edge => edge.target === node.id);
        }) || nodes[0];

        // Build adjacency list for graph traversal
        const adjacencyList: Record<string, string[]> = {};
        nodes.forEach(node => {
            adjacencyList[node.id] = [];
        });
        edges.forEach(edge => {
            if (adjacencyList[edge.source]) {
                adjacencyList[edge.source].push(edge.target);
            }
        });

        // BFS to assign levels
        const levels: Record<string, number> = {};
        const queue: Array<{ id: string; level: number }> = [{ id: entryNode.id, level: 0 }];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const { id, level } = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);
            levels[id] = level;

            adjacencyList[id]?.forEach(childId => {
                if (!visited.has(childId)) {
                    queue.push({ id: childId, level: level + 1 });
                }
            });
        }

        // Group nodes by level
        const nodesByLevel: Record<number, string[]> = {};
        Object.entries(levels).forEach(([nodeId, level]) => {
            if (!nodesByLevel[level]) {
                nodesByLevel[level] = [];
            }
            nodesByLevel[level].push(nodeId);
        });

        // Position nodes
        const updatedNodes = nodes.map(node => {
            const level = levels[node.id] ?? 0;
            const nodesInLevel = nodesByLevel[level] || [node.id];
            const indexInLevel = nodesInLevel.indexOf(node.id);

            let x, y;
            if (orientation === 'vertical') {
                // Vertical layout: nodes flow from top to bottom
                y = level * (nodeHeight + verticalSpacing);
                // Center nodes horizontally based on how many are in this level
                const levelWidth = nodesInLevel.length * (nodeWidth + horizontalSpacing);
                x = (indexInLevel * (nodeWidth + horizontalSpacing)) - (levelWidth / 2) + (nodeWidth / 2) + 400;
            } else {
                // Horizontal layout: nodes flow from left to right
                x = level * (nodeWidth + horizontalSpacing);
                // Center nodes vertically based on how many are in this level
                const levelHeight = nodesInLevel.length * (nodeHeight + verticalSpacing);
                y = (indexInLevel * (nodeHeight + verticalSpacing)) - (levelHeight / 2) + (nodeHeight / 2) + 900;
            }

            return {
                ...node,
                position: { x, y },
            };
        });

        setNodes(updatedNodes);

        // Fit view after layout
        setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
        }, 50);

        toast({
            title: 'Layout Applied',
            description: `Nodes arranged in ${orientation} hierarchical layout`,
        });
    }, [nodes, edges, reactFlowInstance, setNodes, toast]);

    // Toggle layout orientation
    const toggleLayoutOrientation = () => {
        const newOrientation = layoutOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        setLayoutOrientation(newOrientation);
        applyHierarchicalLayout(newOrientation);
    };

    return (
        <div
            className={`${isFullScreen ? 'fixed inset-0 z-50' : 'relative'
                } bg-slate-900 flex flex-col transition-all duration-300`}
            style={{ height: isFullScreen ? '100vh' : '83vh' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-base font-semibold text-slate-100">Flow Builder</h2>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {nodes.length} nodes • {edges.length} connections
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded flex items-center gap-1.5">
                        {layoutOrientation === 'vertical' ? (
                            <>
                                <ArrowDownUp className="h-3 w-3" />
                                Vertical Layout
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft className="h-3 w-3" />
                                Horizontal Layout
                            </>
                        )}
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
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
                <aside className="w-[280px] bg-slate-800 border-r border-slate-700 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-slate-100 mb-4">Node Types</h3>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs font-medium text-slate-400 uppercase mb-2 px-2">Input/Output</h4>
                                <div className="space-y-1">
                                    <ComponentItem label="Interactive Node" type="button" />
                                    <ComponentItem label="Interactive List" type="interactiveList" />
                                    <ComponentItem label="Input Node" type="input" />
                                    <ComponentItem label="Message" type="simpleMessage" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-slate-400 uppercase mb-2 px-2">Processing</h4>
                                <div className="space-y-1">
                                    <ComponentItem label="Language Model" type="ai" />
                                    <ComponentItem label="Engine" type="engine" />
                                    <ComponentItem label="Agent" type="agentSelector" comingSoon />
                                    <ComponentItem label="Condition" type="condition" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-slate-400 uppercase mb-2 px-2">Integration</h4>
                                <div className="space-y-1">
                                    <ComponentItem label="API Library" type="apiLibrary" />
                                    <ComponentItem label="Knowledge Base" type="knowledgeBase" />
                                </div>
                            </div>
                        </div>
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
                        nodeTypes={nodeTypes}
                        nodesDraggable={!isLocked}
                        nodesConnectable={!isLocked}
                        elementsSelectable={!isLocked}
                        fitView
                        className="bg-slate-900"
                        defaultEdgeOptions={{
                            style: { stroke: '#64748b', strokeWidth: 2 },
                            type: 'smoothstep',
                        }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#475569" />

                        {/* Custom Controls Panel */}
                        <Panel position="bottom-left" className="flex gap-2 mb-4 ml-4">
                            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-lg">
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleFitView}
                                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                                    title="Fit View"
                                >
                                    <Maximize className="h-4 w-4" />
                                </button>
                                <div className="w-px h-6 bg-slate-700" />
                                <button
                                    onClick={toggleLayoutOrientation}
                                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                                    title={layoutOrientation === 'vertical' ? 'Switch to Horizontal Layout' : 'Switch to Vertical Layout'}
                                >
                                    {layoutOrientation === 'vertical' ? (
                                        <ArrowRightLeft className="h-4 w-4" />
                                    ) : (
                                        <ArrowDownUp className="h-4 w-4" />
                                    )}
                                </button>
                                <button
                                    onClick={handleAddNote}
                                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                                    title="Fit View"
                                >
                                    <StickyNote className="h-4 w-4" />
                                </button>
                                <div className="w-px h-6 bg-slate-600" />
                                <button
                                    onClick={() => setIsLocked(!isLocked)}
                                    className={`p-2 rounded transition-colors ${isLocked
                                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                        : 'hover:bg-slate-700 text-slate-300 hover:text-white'
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

            {/* Condition Configuration Drawer */}
            {showConditionDrawer && editingConditionNodeId && (() => {
                const node = nodes.find((n) => n.id === editingConditionNodeId);
                return (
                    <ConditionConfigDrawer
                        isOpen={showConditionDrawer}
                        onClose={() => {
                            setShowConditionDrawer(false);
                            setEditingConditionNodeId(null);
                        }}
                        nodeId={editingConditionNodeId}
                        conditionGroups={node?.data?.conditionGroups}
                        conditions={node?.data?.conditions}
                        hasDefaultOutput={node?.data?.hasDefaultOutput}
                        onSave={handleSaveConditions}
                    />
                );
            })()}

            {/* Agent Configuration Panel */}
            {showAgentConfig && editingAgentNodeId && (() => {
                const node = nodes.find((n) => n.id === editingAgentNodeId);
                return (
                    <AgentConfigPanel
                        isOpen={showAgentConfig}
                        onClose={() => {
                            setShowAgentConfig(false);
                            setEditingAgentNodeId(null);
                        }}
                        nodeId={editingAgentNodeId}
                        config={node?.data?.configuration || {}}
                        onSave={handleSaveAgentConfig}
                    />
                );
            })()}

            {/* Agent Selector Configuration Panel */}
            {showAgentSelectorConfig && editingAgentSelectorNodeId && (() => {
                const node = nodes.find((n) => n.id === editingAgentSelectorNodeId);
                return (
                    <AgentSelectorConfigPanel
                        isOpen={showAgentSelectorConfig}
                        onClose={() => {
                            setShowAgentSelectorConfig(false);
                            setEditingAgentSelectorNodeId(null);
                        }}
                        nodeId={editingAgentSelectorNodeId}
                        config={{
                            selectedAgentId: node?.data?.selectedAgentId,
                            selectedAgentName: node?.data?.selectedAgentName,
                            selectedAgentDescription: node?.data?.selectedAgentDescription,
                        }}
                        onSave={handleSaveAgentSelectorConfig}
                    />
                );
            })()}
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
function ComponentItem({ label, type, comingSoon = false }: { label: string; type: string; comingSoon?: boolean }) {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        if (comingSoon) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    if (comingSoon) {
        return (
            <div className="relative">
                <div
                    className="px-4 py-2.5 text-sm rounded cursor-not-allowed transition-colors border-l-2 border-transparent overflow-hidden"
                >
                    {/* Blur effect - positioned behind text */}
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-800/40"></div>
                    {/* Text stays visible above blur */}
                    <span className="font-medium text-slate-300 relative z-10">{label}</span>
                </div>
                {/* Coming Soon Badge */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 px-2 py-0.5 bg-slate-900/90 backdrop-blur-md rounded border border-purple-500/50 shadow-lg shadow-purple-500/20">
                    <Clock className="h-3 w-3 text-purple-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-purple-400">Coming Soon</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 rounded cursor-grab active:cursor-grabbing transition-colors border-l-2 border-transparent hover:border-indigo-500"
            onDragStart={(event) => onDragStart(event, type)}
            draggable
        >
            <span className="font-medium">{label}</span>
        </div>
    );
}

