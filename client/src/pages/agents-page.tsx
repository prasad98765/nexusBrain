import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreVertical, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { AgentCreateDrawer } from '@/components/agents/AgentCreateDrawer';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Agent {
    id: string;
    name: string;
    type: string;
    description: string;
    status: string;
    configuration: {
        promptInstructions?: string;
        tools?: any[];
        knowledgeBase?: boolean;
        selectedKbDocs?: string[];
        buttons?: {
            enabled: boolean;
            llmDescription?: string;
        };
        cards?: {
            enabled: boolean;
            llmDescription?: string;
        };
        carousels?: {
            enabled: boolean;
            llmDescription?: string;
        };
        callForward?: boolean;
        webSearch?: {
            enabled: boolean;
            llmDescription?: string;
        };
        connectFlow?: {
            enabled: boolean;
            flowId?: string;
            flowName?: string;
            llmDescription?: string;
        };
    };
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
}

interface AgentsResponse {
    agents: Agent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AgentsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch agents
    const { data: agentsData, isLoading } = useQuery<AgentsResponse>({
        queryKey: ['agents', page, limit, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            const response = await apiClient.get(`/api/agents?${params}`);
            return response.json();
        },
    });

    // Create agent mutation
    const createAgentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post('/api/agents', {
                type: 'web', // Default type
                name: data.name,
                description: data.promptInstructions?.substring(0, 200),
                status: 'draft',
                configuration: {
                    promptInstructions: data.promptInstructions,
                    tools: data.tools,
                    knowledgeBase: data.knowledgeBase,
                    selectedKbDocs: data.selectedKbDocs,
                    buttons: data.buttons,
                    cards: data.cards,
                    carousels: data.carousels,
                    callForward: data.callForward,
                    webSearch: data.webSearch,
                    connectFlow: data.connectFlow,
                },
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({
                title: 'Success',
                description: 'Agent created successfully',
            });
            setDrawerOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create agent',
                variant: 'destructive',
            });
        },
    });

    // Update agent mutation
    const updateAgentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await apiClient.patch(`/api/agents/${id}`, {
                name: data.name,
                description: data.promptInstructions?.substring(0, 200),
                configuration: {
                    promptInstructions: data.promptInstructions,
                    tools: data.tools,
                    knowledgeBase: data.knowledgeBase,
                    selectedKbDocs: data.selectedKbDocs,
                    buttons: data.buttons,
                    cards: data.cards,
                    carousels: data.carousels,
                    callForward: data.callForward,
                    webSearch: data.webSearch,
                    connectFlow: data.connectFlow,
                },
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({
                title: 'Success',
                description: 'Agent updated successfully',
            });
            setDrawerOpen(false);
            setEditingAgent(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update agent',
                variant: 'destructive',
            });
        },
    });

    // Delete agent mutation
    const deleteAgentMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/agents/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({
                title: 'Success',
                description: 'Agent deleted successfully',
            });
            setDeleteConfirmOpen(false);
            setAgentToDelete(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete agent',
                variant: 'destructive',
            });
        },
    });

    const handleCreateAgent = () => {
        setEditingAgent(null);
        setDrawerOpen(true);
    };

    const handleEditAgent = (agent: Agent) => {
        setEditingAgent(agent);
        setDrawerOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setAgentToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (agentToDelete) {
            deleteAgentMutation.mutate(agentToDelete);
        }
    };

    const handleSaveAgent = (data: any) => {
        if (editingAgent) {
            updateAgentMutation.mutate({ id: editingAgent.id, data });
        } else {
            createAgentMutation.mutate(data);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-purple-400" />
                        Agents
                    </h1>
                    <p className="text-slate-400 mt-1">Create and manage intelligent AI agents</p>
                </div>
                <Button
                    onClick={handleCreateAgent}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Search agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Show:</span>
                    <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                        <SelectTrigger className="w-[100px] bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="10" className="text-slate-200">10</SelectItem>
                            <SelectItem value="25" className="text-slate-200">25</SelectItem>
                            <SelectItem value="50" className="text-slate-200">50</SelectItem>
                            <SelectItem value="100" className="text-slate-200">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-slate-400">per page</span>
                </div>
            </div>

            {/* Total Count */}
            {agentsData && agentsData.total > 0 && (
                <div className="text-sm text-slate-400">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, agentsData.total)} of {agentsData.total} agents
                </div>
            )}

            {/* Agents Table/List */}
            {isLoading ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <div className="divide-y divide-slate-700">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-700 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                                        <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : agentsData?.agents && agentsData.agents.length > 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-800/50 border-b border-slate-700 text-sm font-medium text-slate-400">
                        <div className="col-span-4">Agent Name</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Tools & Features</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-slate-700">
                        {agentsData.agents.map((agent) => (
                            <div key={agent.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-700/30 transition-colors group">
                                {/* Agent Name */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg ring-1 ring-purple-500/20 flex-shrink-0">
                                        <Bot className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
                                            {agent.name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            <Badge variant="outline" className="text-xs mt-1">
                                                {agent.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="col-span-3 flex items-center">
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                        {agent.description || 'No description'}
                                    </p>
                                </div>

                                {/* Tools & Features */}
                                <div className="col-span-2 flex items-center">
                                    <div className="flex flex-wrap gap-1">
                                        {agent.configuration?.tools && agent.configuration.tools.length > 0 && (
                                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                                                {agent.configuration.tools.length} Tool{agent.configuration.tools.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {agent.configuration?.knowledgeBase && (
                                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                                                KB
                                            </Badge>
                                        )}
                                        {agent.configuration?.webSearch && (
                                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                                                Web
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Created Date */}
                                <div className="col-span-2 flex items-center">
                                    <span className="text-sm text-slate-400">
                                        {new Date(agent.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex items-center justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                            <DropdownMenuItem
                                                onClick={() => handleEditAgent(agent)}
                                                className="text-slate-300 cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteClick(agent.id)}
                                                className="text-red-400 focus:text-red-400 cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-indigo-600/10 rounded-lg flex items-center justify-center mx-auto mb-4 ring-1 ring-purple-500/20">
                            <Sparkles className="text-purple-400 h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">No agents yet</h2>
                        <p className="text-slate-400 max-w-md mb-6">
                            Create your first AI agent to get started with autonomous task execution
                        </p>
                        <Button
                            onClick={handleCreateAgent}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Agent
                        </Button>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {agentsData && agentsData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        Page {page} of {agentsData.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="border-slate-700 text-slate-300"
                        >
                            First
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="border-slate-700 text-slate-300"
                        >
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {(() => {
                                const maxVisible = 5;
                                const pages = [];
                                let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                                let endPage = Math.min(agentsData.totalPages, startPage + maxVisible - 1);

                                if (endPage - startPage + 1 < maxVisible) {
                                    startPage = Math.max(1, endPage - maxVisible + 1);
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(i);
                                }

                                return pages.map((p) => (
                                    <Button
                                        key={p}
                                        variant={p === page ? 'default' : 'outline'}
                                        onClick={() => setPage(p)}
                                        className={p === page ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-700 text-slate-300'}
                                        size="sm"
                                    >
                                        {p}
                                    </Button>
                                ));
                            })()}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.min(agentsData.totalPages, p + 1))}
                            disabled={page === agentsData.totalPages}
                            className="border-slate-700 text-slate-300"
                        >
                            Next
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage(agentsData.totalPages)}
                            disabled={page === agentsData.totalPages}
                            className="border-slate-700 text-slate-300"
                        >
                            Last
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit Drawer */}
            <AgentCreateDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setEditingAgent(null);
                }}
                onSave={handleSaveAgent}
                existingData={editingAgent ? {
                    name: editingAgent.name,
                    promptInstructions: editingAgent.configuration?.promptInstructions || '',
                    tools: editingAgent.configuration?.tools || [],
                    knowledgeBase: editingAgent.configuration?.knowledgeBase || false,
                    selectedKbDocs: editingAgent.configuration?.selectedKbDocs || [],
                    buttons: editingAgent.configuration?.buttons || { enabled: false },
                    cards: editingAgent.configuration?.cards || { enabled: false },
                    carousels: editingAgent.configuration?.carousels || { enabled: false },
                    callForward: editingAgent.configuration?.callForward || false,
                    webSearch: editingAgent.configuration?.webSearch || { enabled: false },
                    connectFlow: editingAgent.configuration?.connectFlow || { enabled: false },
                } : undefined}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-100">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            This action cannot be undone. This will permanently delete the agent
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-700 text-slate-300">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
