import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { List, Trash2, Copy, Minimize2, Maximize2, Edit2, Info, MessageSquare, ExternalLink, Phone, Mail, ArrowRight, ChevronDown } from 'lucide-react';
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

interface ButtonSection {
    id: string;
    sectionName: string;
    buttons: ButtonConfig[];
}

interface InteractiveListNodeData {
    label: string;
    message: string;
    headerText?: string; // Max 60 chars, text only
    buttonListTitle?: string; // Max 20 chars
    sections?: ButtonSection[]; // Up to 10 sections
    footer?: string;
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

export default function InteractiveListNode({ id, data, selected }: NodeProps<InteractiveListNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Interactive List');
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

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
        if (e && (e.target as HTMLElement).closest('button')) {
            return;
        }
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'interactiveList' } });
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
            setLabelValue(data.label || 'Interactive List');
            setIsEditingLabel(false);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Calculate total buttons across all sections
    const totalButtons = (data.sections || []).reduce((sum, section) => sum + section.buttons.length, 0);

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[320px] max-w-[400px] hover:shadow-2xl hover:shadow-purple-500/10 ${
                    selected ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-purple-500/20' : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={handleNodeClick}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-purple-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-purple-500/20 rounded-md ring-1 ring-purple-500/30">
                            <List className="h-4 w-4 text-purple-400" />
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
                                {data.label || 'Interactive List'}
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
                    <div className="space-y-0">
                        {/* Header Text (if exists) */}
                        {data.headerText && (
                            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                                <p className="text-sm text-slate-300 font-medium">{data.headerText}</p>
                            </div>
                        )}

                        {/* Message Body */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Message
                                </label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                        <p>The message content displayed to users</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg px-3.5 py-3 text-sm text-slate-200 shadow-inner min-h-[60px] leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: data.message || '<span class="text-slate-500 italic">Click to edit message...</span>' }} />
                            </div>
                        </div>

                        {/* Button Sections */}
                        {data.sections && data.sections.length > 0 && (
                            <div className="px-4 pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <List className="h-3.5 w-3.5" />
                                        {data.buttonListTitle || 'Options'} ({data.sections.length} sections, {totalButtons} buttons)
                                    </label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs max-w-[200px]">
                                            <p>Organized button sections for list interactions</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="space-y-2">
                                    {data.sections.map((section, sectionIdx) => {
                                        const isExpanded = expandedSections[section.id] !== false;
                                        
                                        return (
                                            <div key={section.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-600/50 rounded-lg overflow-hidden">
                                                {/* Section Header */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(section.id);
                                                    }}
                                                    className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ChevronDown 
                                                            className={`h-3.5 w-3.5 text-purple-400 transition-transform ${
                                                                isExpanded ? '' : '-rotate-90'
                                                            }`} 
                                                        />
                                                        <span className="font-semibold text-sm text-slate-200">{section.sectionName}</span>
                                                        <span className="text-xs text-slate-500">({section.buttons.length})</span>
                                                    </div>
                                                </button>

                                                {/* Section Buttons */}
                                                {isExpanded && (
                                                    <div className="px-2 pb-2 space-y-1.5">
                                                        {section.buttons.map((btn, btnIdx) => {
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

                                                            const getActionIcon = () => {
                                                                switch (btn.actionType) {
                                                                    case 'connect_to_node': return <ArrowRight className="h-3 w-3" />;
                                                                    case 'call_number': return <Phone className="h-3 w-3" />;
                                                                    case 'send_email': return <Mail className="h-3 w-3" />;
                                                                    case 'open_url': return <ExternalLink className="h-3 w-3" />;
                                                                    default: return <ArrowRight className="h-3 w-3" />;
                                                                }
                                                            };

                                                            return (
                                                                <div key={btn.id} className="relative group">
                                                                    <div className={`bg-slate-700/60 border rounded-md px-3 py-2 transition-all hover:shadow-sm ${
                                                                        !isValid ? 'border-red-500/50 shadow-red-500/10' : 'border-gray-600/40 hover:border-purple-500/30'
                                                                    }`}>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`p-0.5 rounded ${
                                                                                btn.actionType === 'connect_to_node' ? 'bg-purple-500/20 text-purple-400' :
                                                                                btn.actionType === 'call_number' ? 'bg-green-500/20 text-green-400' :
                                                                                btn.actionType === 'send_email' ? 'bg-orange-500/20 text-orange-400' :
                                                                                'bg-blue-500/20 text-blue-400'
                                                                            }`}>
                                                                                {getActionIcon()}
                                                                            </div>
                                                                            <span className="font-medium text-xs text-slate-200 flex-1">{btn.label}</span>
                                                                            {!isValid && (
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span className="text-xs text-red-400 font-medium cursor-help">
                                                                                            ⚠
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                                                                                        <p>{validationError}</p>
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
                                                                                    id={`section-${sectionIdx}-button-${btnIdx}`}
                                                                                    className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 !right-[-7px] hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                                                                                    style={{ top: '50%' }}
                                                                                />
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                                                                                <p>Connect to next node</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer (if exists) */}
                        {data.footer && (
                            <div className="px-4 pb-3">
                                <p className="text-xs text-slate-500 italic">{data.footer}</p>
                            </div>
                        )}

                        {/* Click to edit hint */}
                        <div className="px-4 pb-4">
                            <div className="pt-3 border-t border-slate-700/50">
                                <p className="text-xs text-slate-500 text-center italic">
                                    Click node to configure settings
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <p className="text-xs text-slate-400 truncate font-medium flex-1">
                                {data.message ? data.message.substring(0, 50).replace(/<[^>]*>/g, '') + '...' : 'Interactive List'}
                            </p>
                            {data.sections && data.sections.length > 0 && (
                                <span className="text-xs text-slate-500">
                                    {data.sections.length} sections
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Handles */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Handle
                            type="target"
                            position={Position.Left}
                            className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
                        <p>Connect from previous node</p>
                    </TooltipContent>
                </Tooltip>
                {/* Main output handle - only show if no connect_to_node buttons */}
                {(!data.sections || !data.sections.some(s => s.buttons.some(b => b.actionType === 'connect_to_node'))) && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Handle
                                type="source"
                                position={Position.Right}
                                className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-gray-900 hover:!w-4 hover:!h-4 transition-all !shadow-lg !shadow-purple-500/50"
                            />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                            <p>Connect to next node</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}
