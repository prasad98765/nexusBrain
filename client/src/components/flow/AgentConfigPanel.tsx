/**
 * Agent Configuration Panel
 * 
 * Drawer panel for Agent capabilities:
 * - Button, Card, Carousel
 * - Web Search
 * - Path (Sub-Agent Calling)
 */

import React, { useState, useEffect } from 'react';
import { X, MousePointer, LayoutGrid, Layers, Globe, GitBranch, Plus, Bot, Settings2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentConfig {
    button?: {
        enabled: boolean;
        description: string;
    };
    card?: {
        enabled: boolean;
        description: string;
    };
    carousel?: {
        enabled: boolean;
        description: string;
    };
    webSearch?: {
        enabled: boolean;
        description: string;
    };
    path?: {
        enabled: boolean;
        subAgents: Array<{
            id: string;
            name: string;
            type: 'assistant' | 'agent';
            description?: string;
        }>;
    };
}

interface AgentConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    config: AgentConfig;
    onSave: (config: AgentConfig) => void;
}

export default function AgentConfigPanel({ isOpen, onClose, nodeId, config, onSave }: AgentConfigPanelProps) {
    const [localConfig, setLocalConfig] = useState<AgentConfig>(config);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string; description?: string; agentType: string }>>([]);
    const [showCreateAssistantDialog, setShowCreateAssistantDialog] = useState(false);
    const [newAssistantName, setNewAssistantName] = useState('');

    useEffect(() => {
        setLocalConfig(config);
        // Set initial active section based on enabled toggles
        const enabledSections = Object.keys(config).filter(key => config[key as keyof AgentConfig]?.enabled);
        if (enabledSections.length > 0) {
            setActiveSection(enabledSections[0]);
        }
    }, [config]);

    useEffect(() => {
        if (isOpen) {
            // Fetch available assistants and agents for Path section
            fetchAvailableAgents();
        }
    }, [isOpen]);

    const fetchAvailableAgents = async () => {
        try {
            const response = await apiClient.get('/api/flow-agents?limit=100');
            if (response.ok) {
                const data = await response.json();
                setAvailableAgents(data.agents || []);
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        }
    };

    const updateToggle = (key: keyof AgentConfig, enabled: boolean) => {
        if (key === 'path') {
            setLocalConfig(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    enabled,
                    subAgents: prev[key]?.subAgents || []
                }
            }));
        } else {
            setLocalConfig(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    enabled,
                    description: (prev[key] as any)?.description || ''
                }
            }));
        }

        // Accordion behavior: when enabled, close other sections and open this one
        if (enabled) {
            setActiveSection(key);
        } else {
            setActiveSection(null);
        }
    };

    const updateField = (key: keyof AgentConfig, field: string, value: any) => {
        setLocalConfig(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    const handleCreateAssistant = async () => {
        if (!newAssistantName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a name for the assistant',
                variant: 'destructive'
            });
            return;
        }

        try {
            const response = await apiClient.post('/api/flow-agents', {
                name: newAssistantName,
                description: 'Created from Agent Builder',
                isActive: true,
                configuration: { agentType: 'assistant' }
            });

            if (response.ok) {
                const newAgent = await response.json();

                // Add to available agents list
                setAvailableAgents(prev => [...prev, {
                    id: newAgent.id,
                    name: newAgent.name,
                    description: newAgent.description,
                    agentType: 'assistant'
                }]);

                // Add to path configuration
                const currentSubAgents = localConfig.path?.subAgents || [];
                updateField('path', 'subAgents', [
                    ...currentSubAgents,
                    {
                        id: newAgent.id,
                        name: newAgent.name,
                        type: 'assistant' as const,
                        description: ''
                    }
                ]);

                setShowCreateAssistantDialog(false);
                setNewAssistantName('');

                toast({
                    title: 'Success',
                    description: 'Assistant created and added to path'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create assistant',
                variant: 'destructive'
            });
        }
    };

    const addSubAgent = (agentId: string) => {
        const agent = availableAgents.find(a => a.id === agentId);
        if (!agent) return;

        const currentSubAgents = localConfig.path?.subAgents || [];

        // Check if already added
        if (currentSubAgents.some(sa => sa.id === agentId)) {
            toast({
                title: 'Already Added',
                description: 'This agent is already in the path',
                variant: 'destructive'
            });
            return;
        }

        updateField('path', 'subAgents', [
            ...currentSubAgents,
            {
                id: agent.id,
                name: agent.name,
                type: (agent.agentType || 'assistant') as 'assistant' | 'agent',
                description: ''
            }
        ]);
    };

    const removeSubAgent = (agentId: string) => {
        const currentSubAgents = localConfig.path?.subAgents || [];
        updateField('path', 'subAgents', currentSubAgents.filter(sa => sa.id !== agentId));
    };

    const updateSubAgentDescription = (agentId: string, description: string) => {
        const currentSubAgents = localConfig.path?.subAgents || [];
        updateField('path', 'subAgents', currentSubAgents.map(sa =>
            sa.id === agentId ? { ...sa, description } : sa
        ));
    };

    if (!isOpen) return null;

    return (
        <>
            <TooltipProvider>
                <div className="fixed right-0 top-0 h-full w-[420px] bg-gradient-to-br from-slate-900 to-slate-800 border-l border-slate-700/50 shadow-2xl z-50 flex flex-col backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg ring-1 ring-purple-500/30">
                                <Bot className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-100">Agent Configuration</h3>
                                <p className="text-xs text-slate-500">Configure agent capabilities</p>
                            </div>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-700/70 rounded-lg transition-all hover:scale-105"
                                >
                                    <X className="h-5 w-5 text-slate-400 hover:text-slate-200" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                                <p>Close panel (Esc)</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {/* Button Toggle */}
                        <CapabilitySection
                            icon={<MousePointer className="h-5 w-5 text-green-400" />}
                            title="Button"
                            enabled={localConfig.button?.enabled || false}
                            isActive={activeSection === 'button'}
                            onToggle={(checked) => updateToggle('button', checked)}
                        >
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-slate-300 text-sm">Description</Label>
                                    <Textarea
                                        placeholder="Describe what this button action does"
                                        value={localConfig.button?.description || ''}
                                        onChange={(e) => updateField('button', 'description', e.target.value)}
                                        className="bg-slate-700 border-slate-600 mt-2 text-slate-200"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CapabilitySection>

                        {/* Card Toggle */}
                        <CapabilitySection
                            icon={<LayoutGrid className="h-5 w-5 text-cyan-400" />}
                            title="Card"
                            enabled={localConfig.card?.enabled || false}
                            isActive={activeSection === 'card'}
                            onToggle={(checked) => updateToggle('card', checked)}
                        >
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-slate-300 text-sm">Description</Label>
                                    <Textarea
                                        placeholder="Describe what this card displays"
                                        value={localConfig.card?.description || ''}
                                        onChange={(e) => updateField('card', 'description', e.target.value)}
                                        className="bg-slate-700 border-slate-600 mt-2 text-slate-200"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CapabilitySection>

                        {/* Carousel Toggle */}
                        <CapabilitySection
                            icon={<Layers className="h-5 w-5 text-pink-400" />}
                            title="Carousel"
                            enabled={localConfig.carousel?.enabled || false}
                            isActive={activeSection === 'carousel'}
                            onToggle={(checked) => updateToggle('carousel', checked)}
                        >
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-slate-300 text-sm">Description</Label>
                                    <Textarea
                                        placeholder="Describe what this carousel shows"
                                        value={localConfig.carousel?.description || ''}
                                        onChange={(e) => updateField('carousel', 'description', e.target.value)}
                                        className="bg-slate-700 border-slate-600 mt-2 text-slate-200"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CapabilitySection>

                        {/* Web Search Toggle */}
                        <CapabilitySection
                            icon={<Globe className="h-5 w-5 text-yellow-400" />}
                            title="Web Search"
                            enabled={localConfig.webSearch?.enabled || false}
                            isActive={activeSection === 'webSearch'}
                            onToggle={(checked) => updateToggle('webSearch', checked)}
                        >
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-slate-300 text-sm">Description</Label>
                                    <Textarea
                                        placeholder="Describe when to use web search"
                                        value={localConfig.webSearch?.description || ''}
                                        onChange={(e) => updateField('webSearch', 'description', e.target.value)}
                                        className="bg-slate-700 border-slate-600 mt-2 text-slate-200"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CapabilitySection>

                        {/* Path (Sub-Agent) Toggle */}
                        <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GitBranch className="h-5 w-5 text-purple-400" />
                                    <span className="font-medium text-slate-200">Path (Sub-Agent Calling)</span>
                                </div>
                                <Switch
                                    checked={localConfig.path?.enabled || false}
                                    onCheckedChange={(checked) => updateToggle('path', checked)}
                                />
                            </div>
                            {localConfig.path?.enabled && (
                                <div className="space-y-4 pt-3 border-t border-slate-700/50">
                                    <div className="flex gap-2">
                                        <Select onValueChange={addSubAgent}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                                                <SelectValue placeholder="Select assistant" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {availableAgents
                                                    .filter(agent => agent.agentType === 'assistant')
                                                    .map(agent => (
                                                        <SelectItem key={agent.id} value={agent.id} className="text-slate-200">
                                                            <div className="flex flex-col">
                                                                <span>{agent.name}</span>
                                                                {agent.description && (
                                                                    <span className="text-xs text-slate-400">{agent.description}</span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={() => setShowCreateAssistantDialog(true)}
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Create
                                        </Button>
                                    </div>

                                    {/* Selected Sub-Agents */}
                                    <div className="space-y-2">
                                        {localConfig.path.subAgents?.map(subAgent => (
                                            <div key={subAgent.id} className="p-3 bg-slate-700/50 rounded border border-slate-600 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200">{subAgent.name}</p>
                                                        <p className="text-xs text-slate-400">{subAgent.type}</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => removeSubAgent(subAgent.id)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7 p-0"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div>
                                                    <Label className="text-slate-300 text-xs">Custom Description</Label>
                                                    <Input
                                                        placeholder="Add description for this sub-agent"
                                                        value={subAgent.description || ''}
                                                        onChange={(e) => updateSubAgentDescription(subAgent.id, e.target.value)}
                                                        className="bg-slate-800 border-slate-600 text-slate-200 mt-1 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {(!localConfig.path.subAgents || localConfig.path.subAgents.length === 0) && (
                                            <p className="text-sm text-slate-500 text-center py-4">No sub-agents added yet</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer with Cancel and Save Changes Buttons */}
                    <div className="flex-shrink-0 p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm">
                        <p className="text-xs text-slate-400 text-center italic">
                            Changes are saved automatically. Click the Save button in the toolbar to persist your flow.
                        </p>
                    </div>
                </div>
            </TooltipProvider>

            {/* Create Assistant Dialog */}
            <Dialog open={showCreateAssistantDialog} onOpenChange={setShowCreateAssistantDialog}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">Create New Assistant</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Create a new assistant and add it to the agent's path
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-slate-300">Assistant Name</Label>
                            <Input
                                value={newAssistantName}
                                onChange={(e) => setNewAssistantName(e.target.value)}
                                placeholder="Enter assistant name"
                                className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setShowCreateAssistantDialog(false)} variant="outline" className="border-slate-600">
                                Cancel
                            </Button>
                            <Button onClick={handleCreateAssistant} className="bg-purple-600 hover:bg-purple-700">
                                Create & Add
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Helper component for capability sections with accordion behavior
function CapabilitySection({
    icon,
    title,
    enabled,
    isActive,
    onToggle,
    children
}: {
    icon: React.ReactNode;
    title: string;
    enabled: boolean;
    isActive: boolean;
    onToggle: (checked: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-medium text-slate-200">{title}</span>
                </div>
                <Switch
                    checked={enabled}
                    onCheckedChange={onToggle}
                />
            </div>
            {enabled && (
                <div className="p-4 border-t border-slate-700">
                    {children}
                </div>
            )}
        </div>
    );
}
