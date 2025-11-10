import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sparkles, Trash2, Copy, Minimize2, Maximize2 } from 'lucide-react';

interface AINodeData {
    label: string;
    isMinimized?: boolean;
}

export default function AINode({ id, data, selected }: NodeProps<AINodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);

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

    return (
        <div
            className={`bg-[#1a1f2e] rounded-lg border transition-all shadow-xl min-w-[200px] max-w-[280px] ${selected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-purple-900/20">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-200">
                        {data.label || 'OpenAI'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMinimize();
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? (
                            <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                            <Minimize2 className="h-3.5 w-3.5 text-gray-400" />
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate();
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Duplicate"
                    >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="p-1 hover:bg-red-900/50 rounded transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <div className="p-4">
                    <div className="text-center">
                        <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400">AI processes input and generates response</p>
                    </div>
                </div>
            )}

            {isMinimized && (
                <div className="p-3">
                    <p className="text-xs text-gray-400 text-center">AI</p>
                </div>
            )}

            {/* Handles - Only input (left) */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-purple-500 !border-2 !border-[#1a1f2e]"
            />
        </div>
    );
}
