/**
 * Agent Selector Node Component
 * 
 * Special node for selecting and configuring an existing agent
 * Only shows agents where agentType === 'agent'
 * Mutually exclusive with Engine node
 */

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Trash2, Copy, Minimize2, Maximize2, Edit2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentSelectorNodeData {
    label: string;
    isMinimized?: boolean;
    selectedAgentId?: string;
    selectedAgentName?: string;
    selectedAgentDescription?: string;
}

export default function AgentSelectorNode({ id, data, selected }: NodeProps<AgentSelectorNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Agent');

    const handleDelete = () => {
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

    const handleLabelEdit = () => {
        setIsEditingLabel(true);
    };

    const handleLabelSave = () => {
        setIsEditingLabel(false);
        const event = new CustomEvent('updateNodeLabel', { detail: { nodeId: id, label: labelValue } });
        window.dispatchEvent(event);
    };

    const handleLabelKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLabelSave();
        } else if (e.key === 'Escape') {
            setLabelValue(data.label || 'Agent');
            setIsEditingLabel(false);
        }
    };

    const handleNodeClick = (e?: React.MouseEvent) => {
        // Don't trigger if clicking on buttons inside the node
        if (e && (e.target as HTMLElement).closest('button')) {
            return;
        }
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'agentSelector' } });
        window.dispatchEvent(event);
    };

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1e1b2e] to-[#16131f] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto hover:shadow-2xl hover:shadow-purple-500/10 ${selected ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-purple-500/20' : 'border-slate-700 hover:border-slate-600'
                    }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-purple-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-purple-500/20 rounded-md ring-1 ring-purple-500/30">
                            <Bot className="h-4 w-4 text-purple-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-slate-100 bg-transparent border-b border-purple-400 outline-none px-1 focus:border-purple-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-slate-100">
                                {data.label || 'Agent'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {!isEditingLabel && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLabelEdit();
                                        }}
                                        className="p-1.5 hover:bg-slate-700/70 rounded transition-all hover:scale-105"
                                    >
                                        <Edit2 className="h-3.5 w-3.5 text-slate-400 hover:text-slate-200" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
                                    <p>Rename node</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
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
                                    className="p-1.5 hover:bg-red-900/60 rounded transition-all hover:scale-105"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
                                <p>Delete node</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Body */}
                {!isMinimized && (
                    <div className="p-4">
                        <div className="text-center space-y-3">
                            <Bot className="h-8 w-8 text-purple-400 mx-auto" />
                            {data.selectedAgentId ? (
                                <>
                                    <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <p className="text-sm font-medium text-purple-300">{data.selectedAgentName}</p>
                                        {data.selectedAgentDescription && (
                                            <p className="text-xs text-slate-400 mt-1">{data.selectedAgentDescription}</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-slate-400">Click to select an agent</p>
                            )}
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <p className="text-xs text-slate-400 truncate font-medium">
                                {data.selectedAgentName || 'Agent'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Input Handle - Left side */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect from previous node</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
