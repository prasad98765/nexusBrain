import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Type, Trash2, Copy, Minimize2, Maximize2, Edit2, Info, CheckCircle2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface InputNodeData {
    label: string;
    inputType: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'name';
    placeholder?: string;
    required?: boolean;
    isMinimized?: boolean;
}

export default function InputNode({ id, data, selected }: NodeProps<InputNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'User Input');

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
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'input' } });
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
            setLabelValue(data.label || 'User Input');
            setIsEditingLabel(false);
        }
    };

    // Map input types to display labels
    const getInputTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            text: 'Text',
            email: 'Email',
            phone: 'Phone',
            number: 'Number',
            textarea: 'Long Text',
            name: 'Name'
        };
        return labels[type] || type;
    };

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto hover:shadow-2xl hover:shadow-green-500/10 ${selected ? 'border-green-500 ring-2 ring-green-500/50 shadow-green-500/20' : 'border-gray-700 hover:border-gray-600'
                    }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-green-900/30 to-green-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-green-500/20 rounded-md ring-1 ring-green-500/30">
                            <Type className="h-4 w-4 text-green-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-slate-100 bg-transparent border-b border-green-400 outline-none px-1 focus:border-green-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-slate-100">
                                {data.label || 'User Input'}
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
                    <div className="p-4 space-y-3.5" style={{ maxWidth: "350px" }}>
                        {/* Input Type */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Input Type</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                        <p>The type of data this input will collect from users</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-green-400 font-semibold shadow-inner flex items-center justify-between">
                                <span>{getInputTypeLabel(data.inputType)}</span>
                                {data.required && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-red-400 text-base cursor-help">*</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                                            <p>Required field</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* Placeholder Preview */}
                        {data.placeholder && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Question</label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>The question or prompt shown to users</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-300 shadow-inner leading-relaxed break-words overflow-wrap-anywhere">
                                    <div className="break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: data.placeholder }} />
                                </div>
                            </div>
                        )}

                        {/* Field Info */}
                        <div className="flex items-center gap-2 pt-1">
                            {data.required && (
                                <div className="flex items-center gap-1.5 bg-red-900/20 text-red-400 px-2.5 py-1.5 rounded-md border border-red-900/30 text-xs font-medium">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Required</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-green-900/20 text-green-400 px-2.5 py-1.5 rounded-md border border-green-900/30 text-xs font-medium">
                                <Type className="h-3.5 w-3.5" />
                                <span>Input Node</span>
                            </div>
                        </div>

                        {/* Click to edit hint */}
                        <div className="pt-2 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500 text-center italic">
                                Click node to configure settings
                            </p>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-xs text-slate-400 truncate font-medium">
                                {getInputTypeLabel(data.inputType)} input field
                            </p>
                        </div>
                    </div>
                )}

                {/* Handles - positioned at 50% vertically centered */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            className="!w-3.5 !h-3.5 !bg-green-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-green-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect from previous node</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="source"
                            position={Position.Right}
                            className="!w-3.5 !h-3.5 !bg-green-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-green-500/50"
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