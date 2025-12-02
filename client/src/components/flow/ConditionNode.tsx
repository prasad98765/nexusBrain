import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Trash2, Copy, Minimize2, Maximize2, Edit2, Settings } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ConditionRule {
    id: string;
    variable: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
    value: string[];
    valueType: 'static' | 'variable';
    logicOperator?: 'AND' | 'OR'; // Logic operator to apply BEFORE this condition
}

export interface ConditionGroup {
    id: string;
    conditions: ConditionRule[];
    groupLogicOperator?: 'AND' | 'OR'; // Logic operator between this group and the next
}

export interface ConditionNodeData {
    label: string;
    conditionGroups?: ConditionGroup[]; // New group-based structure
    conditions?: ConditionRule[]; // Legacy flat structure for backward compatibility
    isMinimized?: boolean;
}

export default function ConditionNode({ id, data, selected }: NodeProps<ConditionNodeData>) {
    const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label || 'Condition');

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
        const event = new CustomEvent('editNode', { detail: { nodeId: id, type: 'condition' } });
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
            setLabelValue(data.label || 'Condition');
            setIsEditingLabel(false);
        }
    };

    // Calculate total number of groups and conditions
    const conditionGroups = data.conditionGroups || [];
    const totalGroups = conditionGroups.length;
    const totalConditions = conditionGroups.reduce((sum, group) => sum + group.conditions.length, 0);

    // Generate dynamic output handles based on number of groups
    const outputHandles = conditionGroups.map((group, index) => ({
        id: `output-group-${index}`,
        label: `Group ${index + 1}`,
        position: index,
    }));

    return (
        <TooltipProvider>
            <div
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#151922] rounded-lg border transition-all shadow-xl min-w-[280px] !p-0 !w-auto hover:shadow-2xl hover:shadow-amber-500/10 ${selected ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-amber-500/20' : 'border-gray-700 hover:border-gray-600'
                    }`}
                onClick={handleNodeClick}
            >
                {/* Input Handle */}
                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
                />

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-amber-900/30 to-amber-800/20">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 bg-amber-500/20 rounded-md ring-1 ring-amber-500/30">
                            <GitBranch className="h-4 w-4 text-amber-400" />
                        </div>
                        {isEditingLabel ? (
                            <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={handleLabelKeyDown}
                                className="text-sm font-semibold text-slate-100 bg-transparent border-b border-amber-400 outline-none px-1 focus:border-amber-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-slate-100">
                                {data.label || 'Condition'}
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
                    <div className="p-4 space-y-3">
                        {/* Condition Groups Summary */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                    Groups
                                </label>
                                <span className="text-xs text-slate-500">
                                    {totalGroups} {totalGroups === 1 ? 'group' : 'groups'} • {totalConditions} condition{totalConditions !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {totalGroups === 0 ? (
                                <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded border border-slate-700/50 text-center">
                                    No condition groups configured. Click to add.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {conditionGroups.slice(0, 3).map((group, groupIdx) => (
                                        <div key={group.id} className="bg-slate-800/30 p-2 rounded border border-slate-700/50">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-slate-300 font-medium">
                                                    {group.groupLogicOperator && (
                                                        <span className={`font-bold mr-1.5 ${group.groupLogicOperator === 'AND' ? 'text-amber-400' : 'text-purple-400'}`}>
                                                            {group.groupLogicOperator}
                                                        </span>
                                                    )}
                                                    Group {groupIdx + 1}
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {totalGroups > 3 && (
                                        <div className="text-xs text-slate-500 italic text-center">
                                            +{totalGroups - 3} more group{totalGroups - 3 !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Configure Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNodeClick();
                            }}
                            className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-xs font-medium text-amber-400 transition-all flex items-center justify-center gap-2"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Configure Conditions
                        </button>
                    </div>
                )}

                {/* Dynamic Output Handles - One per Group */}
                {outputHandles.length > 0 ? (
                    outputHandles.map((handle, index) => (
                        <Handle
                            key={handle.id}
                            type="source"
                            position={Position.Right}
                            id={handle.id}
                            style={{
                                top: `${((index + 1) / (outputHandles.length + 1)) * 100}%`,
                            }}
                            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
                        />
                    ))
                ) : (
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="output-default"
                        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
                    />
                )}
            </div>
        </TooltipProvider>
    );
}
