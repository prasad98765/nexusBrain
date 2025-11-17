import React, { useState, useEffect } from 'react';
import { Plus, Search, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import CreateVariableModal from './CreateVariableModal';
import { cn } from '@/lib/utils';

interface VariableSelectorProps {
    value?: string;
    onChange: (variableId: string | null) => void;
    label?: string;
}

interface Variable {
    id: string;
    name: string;
    description: string;
    format: string;
}

export default function VariableSelector({ value, onChange, label = 'Save Response To' }: VariableSelectorProps) {
    const { user } = useAuth();
    const [variables, setVariables] = useState<Variable[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchVariables();
    }, []);

    const fetchVariables = async () => {
        // if (!user?.workspaceId) return;

        setLoading(true);
        try {
            const response = await apiClient.get(`/api/variables?limit=100`);
            const data = await response.json();
            setVariables(data.variables || []);
        } catch (err) {
            console.error('Failed to fetch variables:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectedVariable = variables.find(v => v.id === value);

    return (
        <>
            <div className="space-y-2">
                {label && <Label className="text-sm font-medium text-gray-200">{label}</Label>}

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-9 bg-[#0f1419] border-gray-700 text-gray-200 hover:bg-[#1a1f2e] hover:text-gray-200 hover:border-gray-600"
                            style={{ height: '54px' }}
                        >
                            {selectedVariable ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="truncate text-sm">{selectedVariable.name}</span>
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "text-[10px] px-1.5 py-0 h-4",
                                            selectedVariable.format === 'text' && "bg-blue-900/30 text-blue-400 border-blue-700/50",
                                            selectedVariable.format === 'number' && "bg-green-900/30 text-green-400 border-green-700/50",
                                            selectedVariable.format === 'date' && "bg-purple-900/30 text-purple-400 border-purple-700/50",
                                            selectedVariable.format === 'name' && "bg-cyan-900/30 text-cyan-400 border-cyan-700/50",
                                            selectedVariable.format === 'email' && "bg-orange-900/30 text-orange-400 border-orange-700/50",
                                            selectedVariable.format === 'phone' && "bg-pink-900/30 text-pink-400 border-pink-700/50",
                                            selectedVariable.format === 'regex' && "bg-red-900/30 text-red-400 border-red-700/50"
                                        )}
                                    >
                                        {selectedVariable.format}
                                    </Badge>
                                </div>
                            ) : (
                                <span className="text-gray-500 text-sm">Select variable...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0 bg-[#0f1419] border-gray-700/50" align="start">
                        <Command className="bg-[#0f1419] border-0">
                            <CommandInput
                                placeholder="Search variables..."
                                className="h-9 bg-[#0f1419] border-b border-gray-700/30 text-gray-200 placeholder:text-gray-500 focus:ring-0"
                            />
                            <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                <CommandEmpty className="text-gray-400 text-sm py-6 text-center">
                                    No variables found.
                                </CommandEmpty>
                                <CommandGroup className="p-0">
                                    {/* Clear selection option */}
                                    {value && (
                                        <CommandItem
                                            value="__clear__"
                                            onSelect={() => {
                                                onChange(null);
                                                setOpen(false);
                                            }}
                                            className="text-gray-400 hover:bg-[#1a1f2e] hover:text-gray-200 cursor-pointer px-3 py-2 mx-1 my-0.5 rounded"
                                        >
                                            <span className="text-red-400 text-sm">✕ Clear selection</span>
                                        </CommandItem>
                                    )}

                                    {/* Variables list */}
                                    {variables.map((variable) => (
                                        <CommandItem
                                            key={variable.id}
                                            value={`${variable.name} ${variable.description} ${variable.format}`}
                                            onSelect={() => {
                                                onChange(variable.id);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "cursor-pointer px-3 py-2.5 mx-1 my-0.5 rounded transition-colors",
                                                value === variable.id
                                                    ? "bg-blue-600/30 text-gray-100 border border-blue-500/30"
                                                    : "text-gray-200 hover:bg-[#1a1f2e]/60"
                                            )}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 text-green-400",
                                                    value === variable.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className="text-sm font-medium truncate">
                                                    {variable.name}
                                                </div>
                                                {/* <div className="text-xs text-gray-500 truncate mt-0.5">
                                                {variable.description}
                                            </div> */}
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0 h-4 shrink-0",
                                                    variable.format === 'text' && "bg-blue-900/30 text-blue-400 border-blue-700/50",
                                                    variable.format === 'number' && "bg-green-900/30 text-green-400 border-green-700/50",
                                                    variable.format === 'date' && "bg-purple-900/30 text-purple-400 border-purple-700/50",
                                                    variable.format === 'name' && "bg-cyan-900/30 text-cyan-400 border-cyan-700/50",
                                                    variable.format === 'email' && "bg-orange-900/30 text-orange-400 border-orange-700/50",
                                                    variable.format === 'phone' && "bg-pink-900/30 text-pink-400 border-pink-700/50",
                                                    variable.format === 'regex' && "bg-red-900/30 text-red-400 border-red-700/50"
                                                )}
                                            >
                                                {variable.format}
                                            </Badge>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>

                                {/* Create new variable option */}
                                <CommandGroup className="p-0 border-t border-gray-700/50 mt-1">
                                    <CommandItem
                                        onSelect={() => {
                                            setShowCreateModal(true);
                                            setOpen(false);
                                        }}
                                        className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 cursor-pointer px-3 py-2.5 mx-1 my-1 rounded border border-blue-600/20"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        <span className="text-sm font-medium">Create New Variable</span>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Create Variable Modal - Rendered outside popover at root level */}
            <CreateVariableModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchVariables();
                    setShowCreateModal(false);
                }}
                editVariable={null}
            />
        </>
    );
}
