import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Square, Trash2, Copy, Minimize2, Maximize2, Edit2, Info, MessageSquare, Image, Video, FileText, ExternalLink, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

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
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[320px] max-w-[400px] hover:shadow-2xl hover:shadow-blue-500/10 ${selected ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-500/20' : 'border-gray-700 hover:border-gray-600'
                    }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-blue-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-blue-500/20 rounded-md ring-1 ring-blue-500/30">
                            <MessageSquare className="h-4 w-4 text-blue-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-gray-100 bg-transparent border-b border-blue-400 outline-none px-1 focus:border-blue-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-gray-100">
                                {data.label || 'Button Node'}
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
                    <div className="space-y-0">
                        {/* Media Header (if exists) */}
                        {data.media && (
                            <div className="bg-[#0f1419] p-4 border-b border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    {data.media.type === 'image' && <Image className="h-4 w-4 text-blue-400" />}
                                    {data.media.type === 'video' && <Video className="h-4 w-4 text-purple-400" />}
                                    {data.media.type === 'document' && <FileText className="h-4 w-4 text-orange-400" />}
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        {data.media.type}
                                    </span>
                                </div>
                                {data.media.type === 'image' && data.media.url && (
                                    <img
                                        src={data.media.url}
                                        alt={data.media.name || 'Message image'}
                                        className="w-full h-32 object-cover rounded-md border border-gray-700 shadow-lg"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                {data.media.type === 'video' && data.media.url && (
                                    <video
                                        src={data.media.url}
                                        controls
                                        className="w-full h-32 rounded-md border border-gray-700 shadow-lg"
                                    />
                                )}
                                {data.media.type === 'document' && (
                                    <div className="flex items-center gap-3 p-3 bg-[#1a1f2e] rounded-md border border-gray-700">
                                        <div className="p-2 bg-orange-500/20 rounded">
                                            <FileText className="h-5 w-5 text-orange-400" />
                                        </div>
                                        <span className="text-sm text-gray-300 truncate flex-1">{data.media.name || data.media.url}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message Body */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Message
                                </label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
                                        <p>The message content displayed to users</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="bg-gradient-to-br from-[#0f1419] to-[#0a0e14] border border-gray-600/50 rounded-lg px-3.5 py-3 text-sm text-gray-200 shadow-inner min-h-[60px] leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: data.message || '<span class="text-gray-500 italic">Click to edit message...</span>' }} />
                            </div>
                        </div>

                        {/* Buttons */}
                        {data.buttons && data.buttons.length > 0 && (
                            <div className="px-4 pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <Square className="h-3.5 w-3.5" />
                                        Action Buttons ({data.buttons.length})
                                    </label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs max-w-[200px]">
                                            <p>Interactive buttons users can click to trigger actions</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
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

                                        // Get action icon
                                        const getActionIcon = () => {
                                            switch (btn.actionType) {
                                                case 'connect_to_node': return <ArrowRight className="h-3.5 w-3.5" />;
                                                case 'call_number': return <Phone className="h-3.5 w-3.5" />;
                                                case 'send_email': return <Mail className="h-3.5 w-3.5" />;
                                                case 'open_url': return <ExternalLink className="h-3.5 w-3.5" />;
                                                default: return <Square className="h-3.5 w-3.5" />;
                                            }
                                        };

                                        return (
                                            <div key={btn.id} className="relative group">
                                                <div className={`bg-gradient-to-br from-[#0f1419] to-[#0a0e14] border rounded-lg px-3.5 py-2.5 transition-all hover:shadow-md ${!isValid ? 'border-red-500/50 shadow-red-500/10' : 'border-gray-600/50 hover:border-blue-500/30'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={`p-1 rounded ${btn.actionType === 'connect_to_node' ? 'bg-blue-500/20 text-blue-400' :
                                                                btn.actionType === 'call_number' ? 'bg-green-500/20 text-green-400' :
                                                                    btn.actionType === 'send_email' ? 'bg-orange-500/20 text-orange-400' :
                                                                        'bg-purple-500/20 text-purple-400'
                                                            }`}>
                                                            {getActionIcon()}
                                                        </div>
                                                        <span className="font-semibold text-sm text-gray-200">{btn.label}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500 capitalize">
                                                            {btn.actionType === 'connect_to_node' ? 'Connect to node' : btn.actionType.replace('_', ' ')}
                                                        </span>
                                                        {!isValid && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="text-xs text-red-400 font-medium cursor-help">
                                                                        ⚠ {validationError}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs">
                                                                    <p>Click node to fix validation error</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Connection handle for connect_to_node buttons */}
                                                {btn.actionType === 'connect_to_node' && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Handle
                                                                type="source"
                                                                position={Position.Right}
                                                                id={`button-${idx}`}
                                                                className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-gray-900 !right-[-7px] hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-blue-500/50"
                                                                style={{ top: '50%' }}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-xs">
                                                            <p>Connect to next node</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Click to edit hint */}
                        <div className="px-4 pb-4">
                            <div className="pt-3 border-t border-gray-700/50">
                                <p className="text-xs text-gray-500 text-center italic">
                                    Click node to configure settings
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            {/* Media thumbnail indicator */}
                            {data.media && (
                                <div className="flex-shrink-0">
                                    {data.media.type === 'image' && data.media.url && (
                                        <div className="relative w-8 h-8 rounded border border-gray-600 overflow-hidden bg-[#0f1419]">
                                            <img
                                                src={data.media.url}
                                                alt="thumbnail"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    {data.media.type === 'video' && (
                                        <div className="w-8 h-8 rounded border border-purple-500/50 bg-purple-500/20 flex items-center justify-center">
                                            <Video className="h-4 w-4 text-purple-400" />
                                        </div>
                                    )}
                                    {data.media.type === 'document' && (
                                        <div className="w-8 h-8 rounded border border-orange-500/50 bg-orange-500/20 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-orange-400" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <p className="text-xs text-gray-400 truncate font-medium flex-1">
                                {data.message ? data.message.substring(0, 50).replace(/<[^>]*>/g, '') + '...' : 'Button node'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Handles */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-blue-500/50"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 border-gray-700 text-xs">
                        <p>Connect from previous node</p>
                    </TooltipContent>
                </Tooltip>
                {/* Main output handle */}
                {(!data.buttons || data.buttons.length === 0 || !data.buttons.some(b => b.actionType === 'connect_to_node')) && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Handle
                                type="source"
                                position={Position.Right}
                                className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-blue-500/50"
                            />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 border-gray-700 text-xs">
                            <p>Connect to next node</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}
