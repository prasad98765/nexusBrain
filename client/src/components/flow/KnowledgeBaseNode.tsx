import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Trash2, Copy, Minimize2, Maximize2, Edit2, Info, FileText, BookOpen } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface KnowledgeBaseNodeData {
    label: string;
    selectedDocuments: Array<{
        filename: string;
        chunks: number;
        timestamp?: string;
    }>;
    documentCount?: number;
    isMinimized?: boolean;
}

export default function KnowledgeBaseNode({ id, data, selected }: NodeProps<KnowledgeBaseNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Knowledge Base');

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
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'knowledgeBase' } });
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
            setLabelValue(data.label || 'Knowledge Base');
            setIsEditingLabel(false);
        }
    };

    const selectedCount = data.selectedDocuments?.length || 0;

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
                            <Database className="h-4 w-4 text-purple-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-gray-100 bg-transparent border-b border-purple-400 outline-none px-1 focus:border-purple-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-gray-100">
                                {data.label || 'Knowledge Base'}
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
                    <div className="p-4 space-y-3.5">
                        {/* Selected Documents Count */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Selected Documents</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
                                        <p>Documents from knowledge base that will be used for context</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="bg-gradient-to-br from-[#0f1419] to-[#0a0e14] border border-gray-600/50 rounded-lg px-3.5 py-2.5 text-sm text-purple-400 font-semibold shadow-inner flex items-center justify-between">
                                <span>{selectedCount} Document{selectedCount !== 1 ? 's' : ''}</span>
                                {selectedCount > 0 && <BookOpen className="h-4 w-4" />}
                            </div>
                        </div>

                        {/* Document Preview */}
                        {selectedCount > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Documents</label>
                                <div className="bg-gradient-to-br from-[#0f1419] to-[#0a0e14] border border-gray-600/50 rounded-lg px-3.5 py-2.5 max-h-32 overflow-y-auto space-y-1.5">
                                    {data.selectedDocuments.slice(0, 5).map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                                            <FileText className="h-3 w-3 text-purple-400 flex-shrink-0" />
                                            <span className="truncate flex-1">{doc.filename}</span>
                                            <span className="text-gray-500 text-[10px]">{doc.chunks} chunks</span>
                                        </div>
                                    ))}
                                    {selectedCount > 5 && (
                                        <div className="text-xs text-gray-500 italic text-center pt-1">
                                            +{selectedCount - 5} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Configuration Hint */}
                        {selectedCount === 0 && (
                            <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg px-3.5 py-2.5">
                                <p className="text-xs text-purple-400 text-center">
                                    No documents selected
                                </p>
                            </div>
                        )}

                        {/* Node Info Badge */}
                        <div className="flex items-center gap-2 pt-1">
                            <div className="flex items-center gap-1.5 bg-purple-900/20 text-purple-400 px-2.5 py-1.5 rounded-md border border-purple-900/30 text-xs font-medium">
                                <Database className="h-3.5 w-3.5" />
                                <span>Knowledge Base</span>
                            </div>
                        </div>

                        {/* Click to edit hint */}
                        <div className="pt-2 border-t border-gray-700/50">
                            <p className="text-xs text-gray-500 text-center italic">
                                Click node to select documents
                            </p>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <p className="text-xs text-gray-400 truncate font-medium">
                                {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
                            </p>
                        </div>
                    </div>
                )}

                {/* Output Handle - Right side (no input handle) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="knowledge"
                            className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                            style={{ top: '50%' }}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-xs">
                        <p>Connect to Language Model</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
