import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import VariableSelector from '@/components/variables/VariableSelector';
import CreateVariableModal from '@/components/variables/CreateVariableModal';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface JsonResponseViewerProps {
    response: any;
    onAddMapping: (objectPath: string, variableId: string) => void;
    existingMappings?: Array<{ object_path: string; variable_id: string }>;
}

interface CollapsedState {
    [key: string]: boolean;
}

export default function JsonResponseViewer({ response, onAddMapping, existingMappings = [] }: JsonResponseViewerProps) {
    const [collapsed, setCollapsed] = useState<CollapsedState>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [pendingPath, setPendingPath] = useState<string>('');
    const [openPopover, setOpenPopover] = useState<string | null>(null);

    const toggleCollapse = (path: string) => {
        setCollapsed(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const handleAddMapping = (path: string, variableId: string | null) => {
        if (variableId) {
            onAddMapping(path, variableId);
            setOpenPopover(null);
        }
    };

    const handleCreateNewVariable = (path: string) => {
        setPendingPath(path);
        setShowCreateModal(true);
        setOpenPopover(null);
    };

    const getJsonPath = (keys: string[]): string => {
        return keys.reduce((acc, key, index) => {
            if (index === 0) return key;
            // Check if key is an array index
            if (!isNaN(Number(key))) {
                return `${acc}[${key}]`;
            }
            return `${acc}.${key}`;
        }, '');
    };

    const renderValue = (value: any, path: string[] = [], indent: number = 0): React.ReactNode => {
        const currentPath = getJsonPath(path);
        const isCollapsed = collapsed[currentPath];

        if (value === null) {
            return <span className="text-gray-500">null</span>;
        }

        if (typeof value === 'boolean') {
            return <span className="text-purple-400">{value.toString()}</span>;
        }

        if (typeof value === 'number') {
            return <span className="text-green-400">{value}</span>;
        }

        if (typeof value === 'string') {
            return <span className="text-orange-400">"{value}"</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-gray-400">[]</span>;
            }

            return (
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleCollapse(currentPath)}
                            className="hover:bg-gray-700/50 rounded p-0.5"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                            ) : (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                            )}
                        </button>
                        <span className="text-gray-400">
                            [{value.length}]
                        </span>
                    </div>
                    {!isCollapsed && (
                        <div className="ml-4 border-l border-gray-700/50 pl-4 mt-1">
                            {value.map((item, index) => (
                                <div key={index} className="mb-2">
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-400 font-mono text-sm min-w-[30px]">
                                            {index}:
                                        </span>
                                        <div className="flex-1">
                                            {renderValue(item, [...path, index.toString()], indent + 1)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return <span className="text-gray-400">{'{}'}</span>;
            }

            return (
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleCollapse(currentPath)}
                            className="hover:bg-gray-700/50 rounded p-0.5"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                            ) : (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                            )}
                        </button>
                        <span className="text-gray-400">
                            {'{'}{keys.length} {keys.length === 1 ? 'key' : 'keys'}{'}'}
                        </span>
                    </div>
                    {!isCollapsed && (
                        <div className="ml-4 border-l border-gray-700/50 pl-4 mt-1 space-y-2">
                            {keys.map(key => {
                                const keyPath = [...path, key];
                                const keyPathStr = getJsonPath(keyPath);
                                const isMapped = existingMappings.some(m => m.object_path === keyPathStr);
                                
                                return (
                                    <div key={key} className="group">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-blue-400 font-mono text-sm font-medium">
                                                        {key}:
                                                    </span>
                                                    {(typeof value[key] !== 'object' || value[key] === null) && (
                                                        <Popover 
                                                            open={openPopover === keyPathStr} 
                                                            onOpenChange={(open) => setOpenPopover(open ? keyPathStr : null)}
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className={cn(
                                                                        "h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                                                        isMapped && "text-green-400 opacity-100"
                                                                    )}
                                                                >
                                                                    {isMapped ? (
                                                                        <Check className="h-3 w-3" />
                                                                    ) : (
                                                                        <Plus className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent 
                                                                className="w-80 p-2 bg-[#0f1419] border-gray-700/50"
                                                                align="start"
                                                            >
                                                                <div className="space-y-2">
                                                                    <div className="px-2 py-1">
                                                                        <p className="text-xs text-gray-400 mb-1">Object Path</p>
                                                                        <p className="text-xs font-mono text-gray-300 bg-[#1a1f2e] px-2 py-1 rounded">
                                                                            {keyPathStr}
                                                                        </p>
                                                                    </div>
                                                                    <div className="border-t border-gray-700/50 pt-2">
                                                                        <VariableSelector
                                                                            value={existingMappings.find(m => m.object_path === keyPathStr)?.variable_id}
                                                                            onChange={(varId) => handleAddMapping(keyPathStr, varId)}
                                                                            label="Save to Variable"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </div>
                                                <div className="mt-1">
                                                    {renderValue(value[key], keyPath, indent + 1)}
                                                </div>
                                            </div>
                                        </div>
                                        {isMapped && (
                                            <div className="text-xs text-green-400 mt-1 ml-4">
                                                ✓ Mapped to variable
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return <span className="text-gray-400">unknown</span>;
    };

    if (!response) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                No response data available
            </div>
        );
    }

    return (
        <div className="bg-[#0a0e14] rounded-lg p-4 font-mono text-sm overflow-auto">
            {renderValue(response)}
            
            <CreateVariableModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setPendingPath('');
                }}
                onSuccess={() => {
                    setShowCreateModal(false);
                    // Note: After creating variable, user can select it from the popover
                }}
                editVariable={null}
            />
        </div>
    );
}
