import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Type, Trash2, Copy, Minimize2, Maximize2, Edit2 } from 'lucide-react';

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
        <div
            className={`bg-[#1a1f2e] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto ${
                selected ? 'border-green-500 ring-2 ring-green-500/50' : 'border-gray-700'
            }`}
            onClick={handleNodeClick}
            style={{ background: '#1a1f2e' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-green-900/20">
                <div className="flex items-center gap-2 flex-1">
                    <Type className="h-4 w-4 text-green-400" />
                    {isEditingLabel ? (
                        <input
                            type="text"
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            onBlur={handleLabelSave}
                            onKeyDown={handleLabelKeyDown}
                            className="text-sm font-medium text-gray-200 bg-transparent border-b border-green-500 outline-none px-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm font-medium text-gray-200">
                            {data.label || 'User Input'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {!isEditingLabel && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLabelEdit();
                            }}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Rename"
                        >
                            <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                    )}
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
                <div className="p-4 space-y-3">
                    {/* Input Type */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Input Type</label>
                        <div className="bg-[#0f1419] border border-gray-700 rounded px-3 py-2 text-sm text-green-400 font-medium">
                            {getInputTypeLabel(data.inputType)}
                            {data.required && <span className="text-red-400 ml-1">*</span>}
                        </div>
                    </div>

                    {/* Placeholder Preview */}
                    {data.placeholder && (
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Placeholder</label>
                            <div className="bg-[#0f1419] border border-gray-700 rounded px-3 py-2 text-sm text-gray-500 italic">
                                {data.placeholder}
                            </div>
                        </div>
                    )}

                    {/* Field Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {data.required && (
                            <span className="bg-red-900/20 text-red-400 px-2 py-1 rounded">Required</span>
                        )}
                        <span className="bg-green-900/20 text-green-400 px-2 py-1 rounded">🟩 Input Node</span>
                    </div>
                </div>
            )}

            {isMinimized && (
                <div className="p-3">
                    <p className="text-xs text-gray-400 truncate">
                        {getInputTypeLabel(data.inputType)} input field
                    </p>
                </div>
            )}

            {/* Handles - positioned at 50% vertically centered */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-[#1a1f2e]"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-[#1a1f2e]"
                style={{ top: '50%' }}
            />
        </div>
    );
}