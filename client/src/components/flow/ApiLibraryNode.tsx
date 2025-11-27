import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Link2, Trash2, Copy, Minimize2, Maximize2, Edit2, Info, CheckCircle, XCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ApiLibraryNodeData {
    label: string;
    apiLibraryId: string | null;
    apiName: string;
    apiMethod: string;
    isMinimized?: boolean;
}

export default function ApiLibraryNode({ id, data, selected }: NodeProps<ApiLibraryNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'API Library');

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
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'apiLibrary' } });
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
            setLabelValue(data.label || 'API Library');
            setIsEditingLabel(false);
        }
    };

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto hover:shadow-2xl hover:shadow-emerald-500/10 ${selected ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20' : 'border-gray-700 hover:border-gray-600'
                    }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-emerald-900/30 to-emerald-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-emerald-500/20 rounded-md ring-1 ring-emerald-500/30">
                            <Link2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-slate-100 bg-transparent border-b border-emerald-400 outline-none px-1 focus:border-emerald-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-slate-100">
                                {data.label || 'API Library'}
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
                        {data.apiLibraryId ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">API Name</label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                <p>Selected API configuration name</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-emerald-400 font-semibold shadow-inner">
                                        {data.apiName || 'Selected API'}
                                    </div>
                                </div>
                                {data.apiMethod && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Method</label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                                    <p>HTTP request method</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5">
                                            <span className="text-emerald-400 font-mono font-semibold text-sm">{data.apiMethod}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Output Endpoints Badge */}
                                <div className="flex items-center gap-2 pt-1">
                                    <div className="flex items-center gap-1.5 bg-emerald-900/20 text-emerald-400 px-2.5 py-1.5 rounded-md border border-emerald-900/30 text-xs font-medium">
                                        <Link2 className="h-3.5 w-3.5" />
                                        <span>API Call</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5">
                                <div className="text-xs text-slate-500 italic text-center py-1">
                                    No API selected
                                </div>
                            </div>
                        )}

                        {/* Click to edit hint */}
                        <div className="pt-2 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500 text-center italic">
                                Click node to configure API
                            </p>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-xs text-slate-400 truncate font-medium">
                                {data.apiName ? `${data.apiMethod} - ${data.apiName}` : 'No API selected'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Input Handle - Left side centered */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-emerald-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect from previous node</p>
                    </TooltipContent>
                </Tooltip>

                {/* Success Output Handle - Right side, top position */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="success"
                            className="!w-3.5 !h-3.5 !bg-green-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-green-500/50"
                            style={{ top: '35%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <p>Success path</p>
                        </div>
                    </TooltipContent>
                </Tooltip>

                {/* Failure Output Handle - Right side, bottom position */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="failure"
                            className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-red-500/50"
                            style={{ top: '65%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                        <div className="flex items-center gap-1.5">
                            <XCircle className="h-3 w-3 text-red-400" />
                            <p>Failure path</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
