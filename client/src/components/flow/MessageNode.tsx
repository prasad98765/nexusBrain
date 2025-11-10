import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Square, Trash2, Copy, Minimize2, Maximize2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ButtonConfig {
    id: string;
    label: string;
    actionType: 'connect_to_node' | 'call_number' | 'send_email' | 'open_url';
    actionValue?: string;
}

interface MediaContent {
    type: 'image' | 'video' | 'document';
    url: string;
    name?: string;
}

interface ButtonNodeData {
    label: string;
    message: string;
    media?: MediaContent;
    buttons?: ButtonConfig[];
    isMinimized?: boolean;
    isEditingLabel?: boolean;
}

// Validation helpers
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export default function ButtonNode({ id, data, selected }: NodeProps<ButtonNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Button Node');

    const handleDelete = () => {
        // Will be handled by parent component
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
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'button' } });
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
            setLabelValue(data.label || 'Button Node');
            setIsEditingLabel(false);
        }
    };

    return (
        <div
            className={`bg-[#1a1f2e] rounded-lg border transition-all shadow-xl min-w-[320px] max-w-[400px] ${selected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700'
                }`}
            onClick={handleNodeClick}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-blue-900/20">
                <div className="flex items-center gap-2 flex-1">
                    <Square className="h-4 w-4 text-blue-400" />
                    {isEditingLabel ? (
                        <input
                            type="text"
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            onBlur={handleLabelSave}
                            onKeyDown={handleLabelKeyDown}
                            className="text-sm font-medium text-gray-200 bg-transparent border-b border-blue-500 outline-none px-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm font-medium text-gray-200">
                            {data.label || 'Button Node'}
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
                <div className="space-y-0">
                    {/* Media Header (if exists) */}
                    {data.media && (
                        <div className="bg-[#1f2937] p-3 border-b border-gray-700">
                            {data.media.type === 'image' && data.media.url && (
                                <img
                                    src={data.media.url}
                                    alt={data.media.name || 'Message image'}
                                    className="w-full h-32 object-cover rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            {data.media.type === 'video' && data.media.url && (
                                <video
                                    src={data.media.url}
                                    controls
                                    className="w-full h-32 rounded"
                                />
                            )}
                            {data.media.type === 'document' && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                    </svg>
                                    <span className="truncate">{data.media.name || data.media.url}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message Body */}
                    <div className="p-4">
                        <div className="bg-[#0f1419] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 whitespace-pre-wrap min-h-[60px]">
                            {data.message || 'Click to edit message...'}
                        </div>
                    </div>

                    {/* Buttons */}
                    {data.buttons && data.buttons.length > 0 && (
                        <div className="px-4 pb-4">
                            <div className="space-y-2">
                                {data.buttons.map((btn, idx) => {
                                    // Validate button action value
                                    let isValid = true;
                                    let validationError = '';

                                    if (btn.actionValue) {
                                        if (btn.actionType === 'send_email' && !validateEmail(btn.actionValue)) {
                                            isValid = false;
                                            validationError = 'Invalid email';
                                        } else if (btn.actionType === 'call_number' && !validatePhone(btn.actionValue)) {
                                            isValid = false;
                                            validationError = 'Invalid phone';
                                        } else if (btn.actionType === 'open_url' && !validateUrl(btn.actionValue)) {
                                            isValid = false;
                                            validationError = 'Invalid URL';
                                        }
                                    }

                                    return (
                                        <div key={btn.id} className="relative">
                                            <div className={`bg-[#0f1419] border rounded px-3 py-2 text-sm text-gray-300 ${!isValid ? 'border-red-500/50' : 'border-gray-700'
                                                }`}>
                                                <div className="font-medium">{btn.label}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {btn.actionType === 'connect_to_node' ? 'Connect to node' : btn.actionType}
                                                    {!isValid && <span className="text-red-400 ml-2">({validationError})</span>}
                                                </div>
                                            </div>
                                            {/* Connection handle for connect_to_node buttons */}
                                            {btn.actionType === 'connect_to_node' && (
                                                <Handle
                                                    type="source"
                                                    position={Position.Right}
                                                    id={`button-${idx}`}
                                                    className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e] !right-[-6px]"
                                                    style={{ top: '50%' }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isMinimized && (
                <div className="p-3">
                    <p className="text-xs text-gray-400 truncate">
                        {data.message ? data.message.substring(0, 50) + '...' : 'Button node'}
                    </p>
                </div>
            )}

            {/* Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e]"
            />
            {/* Main output handle */}
            {(!data.buttons || data.buttons.length === 0 || !data.buttons.some(b => b.actionType === 'connect_to_node')) && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#1a1f2e]"
                />
            )}
        </div>
    );
}
