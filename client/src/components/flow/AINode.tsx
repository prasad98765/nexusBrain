import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sparkles, Trash2, Copy, Minimize2, Maximize2, Edit2, Info, Sliders } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AINodeData {
    label: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    save_response_variable_id?: string;
    isMinimized?: boolean;
}

export default function AINode({ id, data, selected }: NodeProps<AINodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Language Model');

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

    const handleNodeClick = (e?: React.MouseEvent) => {
        // Don't trigger if clicking on buttons inside the node
        if (e && (e.target as HTMLElement).closest('button')) {
            return;
        }
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'ai' } });
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
            setLabelValue(data.label || 'Language Model');
            setIsEditingLabel(false);
        }
    };

    // Format model name for display
    const getModelDisplayName = (model: string | undefined) => {
        if (!model) return null;
        const parts = model.split('/');
        return parts[parts.length - 1] || model;
    };

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto hover:shadow-2xl hover:shadow-purple-500/10 ${
                    selected ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-purple-500/20' : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-purple-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-purple-500/20 rounded-md ring-1 ring-purple-500/30">
                            <Sparkles className="h-4 w-4 text-purple-400" />
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
                                {data.label || 'Language Model'}
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
                    <div className="p-4 space-y-3.5">
                        {/* Model Selection Display */}
                        {data.model && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Model</label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Selected language model</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-purple-400 font-semibold shadow-inner">
                                    {getModelDisplayName(data.model)}
                                </div>
                            </div>
                        )}

                        {/* Temperature & Max Tokens */}
                        {(data.temperature !== undefined || data.maxTokens !== undefined) && (
                            <div className="grid grid-cols-2 gap-2">
                                {data.temperature !== undefined && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Temp</label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                    <p>Controls randomness (0-2)</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-blue-400 font-mono shadow-inner text-center">
                                            {data.temperature}
                                        </div>
                                    </div>
                                )}
                                {data.maxTokens !== undefined && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tokens</label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                    <p>Maximum tokens to generate</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-green-400 font-mono shadow-inner text-center">
                                            {data.maxTokens}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* System Prompt Preview */}
                        {data.systemPrompt && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">System Prompt</label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Instructions for the model</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 max-h-20 overflow-y-auto shadow-inner">
                                    <div 
                                        className="text-xs text-slate-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: data.systemPrompt.substring(0, 100) + (data.systemPrompt.length > 100 ? '...' : '') }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Config status badge */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-purple-900/20 text-purple-400 px-2.5 py-1.5 rounded-md border border-purple-900/30 text-xs font-medium">
                                <Sliders className="h-3.5 w-3.5" />
                                <span>Language Model</span>
                            </div>
                            {data.save_response_variable_id && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 bg-blue-900/20 text-blue-400 px-2.5 py-1.5 rounded-md border border-blue-900/30 text-xs font-medium">
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span>Saves to Variable</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                                        <p>Response will be saved to a variable</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        {/* Click to configure hint */}
                        <div className="pt-2 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500 text-center italic">
                                Click node to configure model
                            </p>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <p className="text-xs text-slate-400 truncate font-medium">
                                {data.model ? getModelDisplayName(data.model) : 'Language Model'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Primary Input Handle - Left side, top position */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="primary"
                            className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                            style={{ top: '35%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Primary input</p>
                    </TooltipContent>
                </Tooltip>

                {/* Knowledge Base Input Handle - Left side, bottom position */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="input"
                            className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-indigo-500/50"
                            style={{ top: '65%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Knowledge Base input</p>
                    </TooltipContent>
                </Tooltip>

                {/* Output Handle - Right side */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="source"
                            position={Position.Right}
                            className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect to next node</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
