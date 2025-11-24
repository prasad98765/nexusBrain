import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Trash2, Copy, Minimize2, Maximize2, Edit2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EngineNodeData {
    label: string;
    isMinimized?: boolean;
}

export default function EngineNode({ id, data, selected }: NodeProps<EngineNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Engine');

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
            setLabelValue(data.label || 'Engine');
            setIsEditingLabel(false);
        }
    };

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto hover:shadow-2xl hover:shadow-orange-500/10 ${
                    selected ? 'border-orange-500 ring-2 ring-orange-500/50 shadow-orange-500/20' : 'border-gray-700 hover:border-gray-600'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-orange-900/30 to-orange-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-orange-500/20 rounded-md ring-1 ring-orange-500/30">
                            <Zap className="h-4 w-4 text-orange-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-gray-100 bg-transparent border-b border-orange-400 outline-none px-1 focus:border-orange-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-gray-100">
                                {data.label || 'Engine'}
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
                                        className="p-1.5 hover:bg-gray-700/70 rounded transition-all hover:scale-105"
                                    >
                                        <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-xs">
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
                                    className="p-1.5 hover:bg-gray-700/70 rounded transition-all hover:scale-105"
                                >
                                    {isMinimized ? (
                                        <Maximize2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                                    ) : (
                                        <Minimize2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-xs">
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
                                    className="p-1.5 hover:bg-gray-700/70 rounded transition-all hover:scale-105"
                                >
                                    <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-xs">
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
                            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-xs">
                                <p>Delete node</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Body */}
                {!isMinimized && (
                    <div className="p-4">
                        <div className="text-center">
                            <Zap className="h-8 w-8 text-orange-400 mx-auto mb-2 animate-pulse" />
                            <p className="text-xs text-gray-400">Execution endpoint for the flow</p>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                            <p className="text-xs text-gray-400 truncate font-medium">Engine</p>
                        </div>
                    </div>
                )}

                {/* Input Handle - Only left side (no output) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-orange-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs">
                        <p>Connect from previous node</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
