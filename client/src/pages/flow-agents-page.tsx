import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Workflow,
    Settings,
    ChevronLeft,
    ChevronRight,
    FileText
} from 'lucide-react';
import AgentFlowBuilder from '@/components/flow/AgentFlowBuilder';
import CreationModeModal from '@/components/flow/CreationModeModal';

interface FlowAgent {
    id: string;
    name: string;
    description?: string;
    flowData?: any;
    workspaceId: string;
    isActive: boolean;
    configuration?: any;
    createdAt: string;
    updatedAt: string;
}

interface AgentsResponse {
    agents: FlowAgent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface Variable {
    id: string;
    name: string;
    description: string;
    format: string;
}

// Memoized AgentsGrid component - only re-renders when data changes, not when parent re-renders
const AgentsGrid = React.memo<{
    agentsData?: AgentsResponse;
    isLoading: boolean;
    debouncedSearchTerm: string;
    page: number;
    onFlowBuilderClick: (agent: FlowAgent) => void;
    onEditClick: (agent: FlowAgent) => void;
    onSettingsClick: (agent: FlowAgent) => void;
    onDeleteAgent: (id: string) => void;
    onPageChange: (page: number) => void;
}>(({ agentsData, isLoading, debouncedSearchTerm, page, onFlowBuilderClick, onEditClick, onSettingsClick, onDeleteAgent, onPageChange }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-slate-700 rounded animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentsData?.agents?.map((agent: FlowAgent) => (
                    <Card key={agent.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <Workflow className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                                        {agent.description && (
                                            <CardDescription className="text-slate-400 text-sm mt-1">
                                                {agent.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                        <DropdownMenuItem
                                            onClick={() => onFlowBuilderClick(agent)}
                                            className="text-slate-300"
                                        >
                                            <Workflow className="h-4 w-4 mr-2" />
                                            Edit Flow
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onEditClick(agent)}
                                            className="text-slate-300"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onSettingsClick(agent)}
                                            className="text-slate-300"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDeleteAgent(agent.id)}
                                            className="text-red-400 focus:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <Badge
                                        variant="outline"
                                        className={agent.isActive
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                        }
                                    >
                                        {agent.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={agent.configuration?.agentType === 'agent'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }
                                    >
                                        {agent.configuration?.agentType === 'agent' ? 'Agent' : 'Assistant'}
                                    </Badge>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {new Date(agent.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {agentsData?.agents?.length === 0 && (
                <div className="text-center py-12">
                    <Workflow className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No flow agents found</h3>
                    <p className="text-slate-500">
                        {debouncedSearchTerm ? 'Try adjusting your search criteria' : 'Create your first flow agent to get started'}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {agentsData && agentsData.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="bg-slate-800 border-slate-600"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-400">
                        Page {page} of {agentsData.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(agentsData.totalPages, page + 1))}
                        disabled={page === agentsData.totalPages}
                        className="bg-slate-800 border-slate-600"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </>
    );
});

export default function FlowAgentsPage() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Debounce search term to prevent focus loss
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showCreationModeModal, setShowCreationModeModal] = useState(false);
    const [creationMode, setCreationMode] = useState<'assistant' | 'agent' | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showFlowBuilder, setShowFlowBuilder] = useState(false);
    const [isFlowFullScreen, setIsFlowFullScreen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<FlowAgent | null>(null);
    const [editingAgent, setEditingAgent] = useState<Partial<FlowAgent>>({
        name: '',
        description: '',
        isActive: true,
        configuration: { promptInstructions: '', agentType: 'assistant' }
    });
    const [showVariableDropdown, setShowVariableDropdown] = useState(false);
    const [variableDropdownPosition, setVariableDropdownPosition] = useState({ top: 0, left: 0 });
    const [cursorPosition, setCursorPosition] = useState(0);
    const promptTextareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Fetch available variables from API
    const { data: variablesData } = useQuery<{ variables: Variable[] }>({
        queryKey: ['/api/variables'],
        queryFn: async () => {
            const response = await apiClient.get('/api/variables?limit=100');
            if (!response.ok) throw new Error('Failed to fetch variables');
            return response.json();
        }
    });

    const availableVariables = variablesData?.variables || [];

    const limit = 12;

    // Fetch agents with pagination and search
    const { data: agentsData, isLoading } = useQuery<AgentsResponse>({
        queryKey: ['/api/flow-agents', page, debouncedSearchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(debouncedSearchTerm && { search: debouncedSearchTerm })
            });
            const response = await fetch(`/api/flow-agents?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch agents');
            return response.json();
        }
    });

    // Create agent mutation
    const createAgentMutation = useMutation({
        mutationFn: async (data: Partial<FlowAgent>) => {
            const response = await fetch('/api/flow-agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create agent');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/flow-agents'] });
            setShowCreateDialog(false);
            setEditingAgent({
                name: '',
                description: '',
                isActive: true,
                configuration: { promptInstructions: '' }
            });
            toast({
                title: "Success",
                description: "Flow agent created successfully"
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to create flow agent",
                variant: "destructive"
            });
        }
    });

    // Update agent mutation
    const updateAgentMutation = useMutation({
        mutationFn: async ({ agentId, data }: { agentId: string; data: Partial<FlowAgent> }) => {
            const response = await fetch(`/api/flow-agents/${agentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update agent');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/flow-agents'] });
            setShowEditDialog(false);
            setShowSettingsDialog(false);
            setSelectedAgent(null);
            toast({
                title: "Success",
                description: "Flow agent updated successfully"
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update flow agent",
                variant: "destructive"
            });
        }
    });

    // Delete agent mutation
    const deleteAgentMutation = useMutation({
        mutationFn: async (agentId: string) => {
            const response = await fetch(`/api/flow-agents/${agentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete agent');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/flow-agents'] });
            toast({
                title: "Success",
                description: "Flow agent deleted successfully"
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to delete flow agent",
                variant: "destructive"
            });
        }
    });

    const handleCreateAgent = (e: React.FormEvent) => {
        e.preventDefault();
        createAgentMutation.mutate(editingAgent);
    };

    const handleUpdateAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent) return;
        updateAgentMutation.mutate({
            agentId: selectedAgent.id,
            data: editingAgent
        });
    };

    const handleEditClick = (agent: FlowAgent) => {
        setSelectedAgent(agent);
        setEditingAgent({
            name: agent.name,
            description: agent.description || '',
            isActive: agent.isActive,
            configuration: agent.configuration || { promptInstructions: '' }
        });
        setShowEditDialog(true);
    };

    const handleSettingsClick = (agent: FlowAgent) => {
        setSelectedAgent(agent);
        setEditingAgent({
            configuration: agent.configuration || { promptInstructions: '' }
        });
        setShowSettingsDialog(true);
    };

    const handleFlowBuilderClick = (agent: FlowAgent) => {
        setSelectedAgent(agent);
        setShowFlowBuilder(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleCreationModeSelect = (mode: 'assistant' | 'agent') => {
        setCreationMode(mode);
        setShowCreationModeModal(false);
        setEditingAgent({
            ...editingAgent,
            configuration: {
                ...editingAgent.configuration,
                agentType: mode
            }
        });
        setShowCreateDialog(true);
    };

    const handlePromptInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;

        setEditingAgent({
            ...editingAgent,
            configuration: {
                ...editingAgent.configuration,
                promptInstructions: value
            }
        });

        setCursorPosition(cursorPos);

        // Check if user typed '#'
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');

        if (lastHashIndex !== -1) {
            const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
            // Show dropdown if '#' is followed by nothing or alphanumeric characters
            if (/^[a-zA-Z0-9_]*$/.test(textAfterHash)) {
                setShowVariableDropdown(true);

                // Calculate dropdown position
                if (promptTextareaRef.current) {
                    const textarea = promptTextareaRef.current;
                    const textareaRect = textarea.getBoundingClientRect();

                    // Create a temporary span to measure text position
                    const tempSpan = document.createElement('span');
                    tempSpan.style.font = window.getComputedStyle(textarea).font;
                    tempSpan.style.visibility = 'hidden';
                    tempSpan.style.position = 'absolute';
                    tempSpan.textContent = textBeforeCursor;
                    document.body.appendChild(tempSpan);

                    const spanRect = tempSpan.getBoundingClientRect();
                    document.body.removeChild(tempSpan);

                    setVariableDropdownPosition({
                        top: textarea.offsetTop + 30, // Position below current line
                        left: Math.min(textarea.offsetLeft + 10, textarea.offsetWidth - 200)
                    });
                }
            } else {
                setShowVariableDropdown(false);
            }
        } else {
            setShowVariableDropdown(false);
        }
    };

    const insertVariable = (variableName: string) => {
        if (!promptTextareaRef.current) return;

        const textarea = promptTextareaRef.current;
        const value = editingAgent.configuration?.promptInstructions || '';
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        // Find the last '#' before cursor
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');

        if (lastHashIndex !== -1) {
            const newValue =
                value.substring(0, lastHashIndex) +
                `#{${variableName}}` +
                textAfterCursor;

            setEditingAgent({
                ...editingAgent,
                configuration: {
                    ...editingAgent.configuration,
                    promptInstructions: newValue
                }
            });

            setShowVariableDropdown(false);

            // Set cursor position after inserted variable
            setTimeout(() => {
                const newCursorPos = lastHashIndex + `#{${variableName}}`.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
            }, 0);
        }
    };

    if (showFlowBuilder && selectedAgent) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowFlowBuilder(false);
                                setIsFlowFullScreen(false);
                                setSelectedAgent(null);
                                queryClient.invalidateQueries({ queryKey: ['/api/flow-agents'] });
                            }}
                            className="text-slate-300 hover:text-white"
                        >
                            ← Back to listing
                        </Button>
                        <h1 className="text-xl font-bold text-slate-100">
                            {selectedAgent.name} - Flow Editor
                        </h1>
                    </div>
                </div>

                {/* Flow Builder */}
                <div className="flex-1 overflow-hidden">
                    <AgentFlowBuilder
                        agentId={selectedAgent.id}
                        isFullScreen={isFlowFullScreen}
                        onToggleFullScreen={() => setIsFlowFullScreen(!isFlowFullScreen)}
                    />
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-48 bg-slate-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Builder</h1>
                    <p className="text-slate-400 mt-1">Build Assistants or Agents with a powerful visual workflow builder.</p>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setShowCreationModeModal(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                </Button>
            </div>

            {/* Search - Not wrapped in form tag to prevent focus loss */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                    placeholder="Search agents by name or description..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 bg-slate-800 border-slate-600 text-white"
                />
            </div>

            {/* Agents Grid */}
            <AgentsGrid
                agentsData={agentsData}
                isLoading={isLoading}
                debouncedSearchTerm={debouncedSearchTerm}
                page={page}
                onFlowBuilderClick={handleFlowBuilderClick}
                onEditClick={handleEditClick}
                onSettingsClick={handleSettingsClick}
                onDeleteAgent={(id: string) => deleteAgentMutation.mutate(id)}
                onPageChange={setPage}
            />

            {/* Create Agent Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create Flow Agent</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Create a new agent with visual flow builder capabilities
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAgent} className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-slate-300">Name *</Label>
                            <Input
                                id="name"
                                value={editingAgent.name}
                                onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description" className="text-slate-300">Description</Label>
                            <Textarea
                                id="description"
                                value={editingAgent.description}
                                onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white"
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive" className="text-slate-300">Active</Label>
                            <Switch
                                id="isActive"
                                checked={editingAgent.isActive}
                                onCheckedChange={(checked) => setEditingAgent({ ...editingAgent, isActive: checked })}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                disabled={createAgentMutation.isPending}
                            >
                                {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Agent Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Flow Agent</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAgent} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name" className="text-slate-300">Name *</Label>
                            <Input
                                id="edit-name"
                                value={editingAgent.name}
                                onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description" className="text-slate-300">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editingAgent.description}
                                onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white"
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-isActive" className="text-slate-300">Active</Label>
                            <Switch
                                id="edit-isActive"
                                checked={editingAgent.isActive}
                                onCheckedChange={(checked) => setEditingAgent({ ...editingAgent, isActive: checked })}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" style={{ backgroundColor: "hsl(262deg 71.2% 60.19%)" }} onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                disabled={updateAgentMutation.isPending}
                            >
                                {updateAgentMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog - Prompt Instructions */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Agent Settings
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Configure prompt instructions and additional settings for this agent
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAgent} className="space-y-4">
                        <div className="relative">
                            <Label htmlFor="prompt-instructions" className="text-slate-300 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Prompt Instructions
                            </Label>
                            <Textarea
                                ref={promptTextareaRef}
                                id="prompt-instructions"
                                value={editingAgent.configuration?.promptInstructions || ''}
                                onChange={handlePromptInstructionsChange}
                                className="bg-slate-700 border-slate-600 text-white mt-2"
                                rows={8}
                                style={{ marginTop: "20px" }}
                                placeholder="Enter system prompt instructions for this agent... (Use # to insert variables)"
                            />

                            {/* Variable Dropdown */}
                            {showVariableDropdown && (
                                <div
                                    className="absolute z-50 bg-slate-800 border border-slate-600 rounded-md shadow-lg w-64 max-h-48 overflow-y-auto"
                                    style={{
                                        top: `${variableDropdownPosition.top}px`,
                                        left: `${variableDropdownPosition.left}px`
                                    }}
                                >
                                    <div className="p-2 text-xs text-slate-400 border-b border-slate-700">
                                        Available Variables
                                    </div>
                                    {availableVariables.length === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            No variables available. Create variables in Settings.
                                        </div>
                                    ) : (
                                        availableVariables.map((variable) => (
                                            <div
                                                key={variable.id}
                                                onClick={() => insertVariable(variable.name)}
                                                className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                                            >
                                                <div className="text-sm text-indigo-400 font-mono">
                                                    #{`{${variable.name}}`}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {variable.description || 'No description'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-slate-500 mt-2">
                                Write a clear, concise instruction that tells the AI when and how to use this API. Be specific about the purpose and expected outcome.                            </p>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" style={{ backgroundColor: "hsl(262deg 71.2% 60.19%)" }} onClick={() => setShowSettingsDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                disabled={updateAgentMutation.isPending}
                            >
                                {updateAgentMutation.isPending ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Creation Mode Modal */}
            <CreationModeModal
                isOpen={showCreationModeModal}
                onClose={() => setShowCreationModeModal(false)}
                onSelectMode={handleCreationModeSelect}
            />
        </div>
    );
}
