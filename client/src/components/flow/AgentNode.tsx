/**
 * Agent Node Component
 * 
 * Special node for Agent mode with configuration toggles for:
 * - Knowledge Base
 * - Button, Card, Carousel capabilities
 * - Web Search
 * - Tools
 * - Path (Sub-Agent Calling)
 * 
 * This is a required node in Agent mode and cannot be deleted.
 */

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Trash2, Copy, Minimize2, Maximize2, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentNodeData {
    label: string;
    isMinimized?: boolean;
    isRequired?: boolean; // Cannot be deleted in Agent mode
    configuration?: {
        knowledgeBase?: {
            enabled: boolean;
            connectedNodes: string[];
        };
        button?: {
            enabled: boolean;
            name: string;
            description: string;
        };
        card?: {
            enabled: boolean;
            name: string;
            description: string;
        };
        carousel?: {
            enabled: boolean;
            name: string;
            description: string;
        };
        webSearch?: {
            enabled: boolean;
            name: string;
            description: string;
        };
        tools?: {
            enabled: boolean;
            connectedTools: string[];
        };
        path?: {
            enabled: boolean;
            subAgents: Array<{
                id: string;
                name: string;
                type: 'assistant' | 'agent';
            }>;
        };
    };
}

export default function AgentNode({ id, data, selected }: NodeProps<AgentNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const handleDelete = () => {
        if (data.isRequired) {
            // Show toast or warning that this node cannot be deleted
            const event = new CustomEvent('showToast', {
                detail: {
                    title: 'Cannot Delete',
                    description: 'Agent node is required and cannot be deleted in Agent mode',
                    variant: 'destructive'
                }
            });
            window.dispatchEvent(event);
            return;
        }
        const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
        window.dispatchEvent(event);
    };

    const handleDuplicate = () => {
        const event = new CustomEvent('duplicateNode', { detail: { nodeId: id } });
        window.dispatchEvent(event);
    };

    const handleToggleMinimize = () => {
        setIsMinimized(!isMinimized);
        const event = new CustomEvent('toggleNodeMinimize', { detail: { nodeId: id, isMinimized: !isMinimized } });
        window.dispatchEvent(event);
    };

    const handleNodeClick = (e?: React.MouseEvent) => {
        // Don't trigger if clicking on buttons inside the node
        if (e && (e.target as HTMLElement).closest('button')) {
            return;
        }
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'agent' } });
        window.dispatchEvent(event);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const config = data.configuration || {};

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1e1b2e] to-[#16131f] rounded-lg border transition-all shadow-xl min-w-[320px] !p-0 !w-auto hover:shadow-2xl hover:shadow-purple-500/10 ${
                    selected ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-purple-500/20' : 'border-slate-700 hover:border-slate-600'
                }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-purple-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-purple-500/20 rounded-md ring-1 ring-purple-500/30">
                            <Bot className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                            {data.label || 'Agent'}
                            {data.isRequired && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Shield className="h-3.5 w-3.5 text-purple-400" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
                                        <p>Required node - cannot be deleted</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleMinimize();
                                    }}
                                    className="p-1.5 hover:bg-slate-700/70 rounded transition-all hover:scale-105"
                                >
                                    {isMinimized ? (
                                        <Maximize2 className="h-3.5 w-3.5 text-slate-400 hover:text-slate-200" />
                                    ) : (
                                        <Minimize2 className="h-3.5 w-3.5 text-slate-400 hover:text-slate-200" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
                                <p>{isMinimized ? 'Expand node' : 'Minimize node'}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicate();
                                    }}
                                    className="p-1.5 hover:bg-slate-700/70 rounded transition-all hover:scale-105"
                                >
                                    <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-200" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
                                <p>Duplicate node</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                    className={`p-1.5 rounded transition-all hover:scale-105 ${
                                        data.isRequired
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-red-900/60'
                                    }`}
                                    disabled={data.isRequired}
                                >
                                    <Trash2 className={`h-3.5 w-3.5 ${
                                        data.isRequired ? 'text-slate-600' : 'text-red-400 hover:text-red-300'
                                    }`} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
                                <p>{data.isRequired ? 'Required node' : 'Delete node'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Body */}
                {!isMinimized && (
                    <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                        <div className="text-center mb-3">
                            <Bot className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                            <p className="text-xs text-slate-400">Autonomous AI Agent</p>
                        </div>

                        {/* Capabilities Summary */}
                        <div className="space-y-1.5">
                            {config.button?.enabled && (
                                <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                    Button
                                </div>
                            )}
                            {config.card?.enabled && (
                                <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                    Card
                                </div>
                            )}
                            {config.carousel?.enabled && (
                                <div className="px-2 py-1 bg-pink-500/10 border border-pink-500/30 rounded text-xs text-pink-400 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                                    Carousel
                                </div>
                            )}
                            {config.webSearch?.enabled && (
                                <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                                    Web Search
                                </div>
                            )}
                            {config.path?.enabled && (
                                <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                                    Sub-Agents ({config.path.subAgents?.length || 0})
                                </div>
                            )}
                        </div>

                        {/* Quick Info */}
                        <div className="mt-3 p-2 bg-slate-800/50 rounded border border-slate-700/50">
                            <p className="text-xs text-slate-400 text-center">
                                Click to configure agent capabilities
                            </p>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <p className="text-xs text-slate-400 truncate font-medium">Agent Configuration</p>
                        </div>
                    </div>
                )}

                {/* Input Handle - Left side for Language Model */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="language-model"
                            className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-indigo-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect Language Model</p>
                    </TooltipContent>
                </Tooltip>

                {/* Output Handle - Right side connects to Engine */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="source"
                            position={Position.Right}
                            className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-orange-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect to Engine</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
