/**
 * Agent Selector Configuration Panel
 * 
 * Drawer panel for selecting an existing agent
 * Only shows agents where agentType === 'agent'
 */

import React, { useState, useEffect } from 'react';
import { X, Bot, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentSelectorConfig {
    selectedAgentId?: string;
    selectedAgentName?: string;
    selectedAgentDescription?: string;
}

interface AgentSelectorConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    config: AgentSelectorConfig;
    onSave: (config: AgentSelectorConfig) => void;
}

export default function AgentSelectorConfigPanel({ isOpen, onClose, nodeId, config, onSave }: AgentSelectorConfigPanelProps) {
    const [localConfig, setLocalConfig] = useState<AgentSelectorConfig>(config);
    const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string; description?: string; agentType: string }>>([]);

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    useEffect(() => {
        if (isOpen) {
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

    const handleSelectAgent = (agentId: string) => {
        const agent = availableAgents.find(a => a.id === agentId);
        if (agent) {
            setLocalConfig({
                selectedAgentId: agent.id,
                selectedAgentName: agent.name,
                selectedAgentDescription: agent.description || ''
            });
        }
    };

    const handleSave = () => {
        if (!localConfig.selectedAgentId) {
            toast({
                title: 'Error',
                description: 'Please select an agent',
                variant: 'destructive'
            });
            return;
        }
        onSave(localConfig);
        onClose();
    };

    if (!isOpen) return null;

    return (
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
                            <p className="text-xs text-slate-500">Select an existing agent</p>
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
                    <div className="space-y-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-inner">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-slate-200 uppercase tracking-wide">Select Agent</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-slate-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                    <p>Choose an existing agent (only agents with type 'agent' are shown)</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <Select value={localConfig.selectedAgentId} onValueChange={handleSelectAgent}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                                <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {availableAgents
                                    .filter(agent => agent.agentType === 'agent')
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

                        {localConfig.selectedAgentId && (
                            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <p className="text-sm font-medium text-purple-300">{localConfig.selectedAgentName}</p>
                                {localConfig.selectedAgentDescription && (
                                    <p className="text-xs text-slate-400 mt-1">{localConfig.selectedAgentDescription}</p>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-slate-500 italic mt-3">
                            This node will execute the selected agent's flow
                        </p>
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
    );
}
