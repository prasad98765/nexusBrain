import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Filter, AlertCircle, PlayCircle, Check, Layers, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { ConditionRule, ConditionGroup } from './ConditionNode';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface Variable {
    id: string;
    name: string;
    description: string;
    format: string;
}

interface ConditionConfigDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    conditions?: ConditionRule[]; // Legacy format for backward compatibility
    conditionGroups?: ConditionGroup[]; // New group-based format
    hasDefaultOutput?: boolean; // Enable default/fallback output
    onSave: (data: { conditionGroups: ConditionGroup[]; hasDefaultOutput: boolean }) => void;
}

const OPERATORS = [
    { value: 'equals', label: 'Equals to' },
    { value: 'not_equals', label: 'Not equals to' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
];

export default function ConditionConfigDrawer({
    isOpen,
    onClose,
    nodeId,
    conditions: legacyConditions,
    conditionGroups: initialConditionGroups,
    hasDefaultOutput: initialHasDefaultOutput,
    onSave,
}: ConditionConfigDrawerProps) {
    const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([]);
    const [hasDefaultOutput, setHasDefaultOutput] = useState(false);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [loading, setLoading] = useState(false);
    const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
    const [showTestPreview, setShowTestPreview] = useState(false);
    const [searchInputs, setSearchInputs] = useState<{ [key: string]: string }>({});
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchVariables();

            // Priority: Use conditionGroups if available, otherwise convert legacy conditions
            if (initialConditionGroups && initialConditionGroups.length > 0) {
                setConditionGroups(initialConditionGroups);
            } else if (legacyConditions && legacyConditions.length > 0) {
                // Convert flat conditions to grouped structure for backward compatibility
                const group: ConditionGroup = {
                    id: `group-${Date.now()}`,
                    conditions: legacyConditions.map(c => ({ ...c })),
                    groupLogicOperator: undefined
                };
                setConditionGroups([group]);
            } else {
                setConditionGroups([]);
            }

            // Initialize default output state
            setHasDefaultOutput(initialHasDefaultOutput || false);
        }
    }, [isOpen, legacyConditions, initialConditionGroups, initialHasDefaultOutput]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const clickedInsideAnyDropdown = Object.values(dropdownRefs.current).some(
                ref => ref && ref.contains(target)
            );
            if (!clickedInsideAnyDropdown) {
                setOpenDropdowns({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchVariables = async () => {
        try {
            setLoading(true);
            const response: any = await apiClient.get('/api/variables?limit=1000');
            const data = await response.json();
            setVariables(data.variables || []);
        } catch (error) {
            console.error('Error fetching variables:', error);
            toast({
                title: 'Error',
                description: 'Failed to load variables',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const createNewCondition = (isFirstInGroup: boolean = false): ConditionRule => ({
        id: `condition-${Date.now()}-${Math.random()}`,
        variable: '',
        operator: 'equals',
        value: [],
        valueType: 'static',
        logicOperator: isFirstInGroup ? undefined : 'AND',
    });

    const createNewGroup = (): ConditionGroup => ({
        id: `group-${Date.now()}-${Math.random()}`,
        conditions: [createNewCondition(true)],
        groupLogicOperator: conditionGroups.length > 0 ? 'AND' : undefined,
    });

    const addGroup = () => {
        const totalConditions = conditionGroups.reduce((sum, group) => sum + group.conditions.length, 0);
        if (totalConditions >= 10) {
            toast({
                title: 'Maximum Conditions Reached',
                description: 'You can only add up to 10 conditions in total',
                variant: 'destructive',
            });
            return;
        }
        setConditionGroups([...conditionGroups, createNewGroup()]);
    };

    const removeGroup = (groupId: string) => {
        setConditionGroups(conditionGroups.filter(g => g.id !== groupId));
    };

    const addConditionToGroup = (groupId: string) => {
        const totalConditions = conditionGroups.reduce((sum, group) => sum + group.conditions.length, 0);
        if (totalConditions >= 10) {
            toast({
                title: 'Maximum Conditions Reached',
                description: 'You can only add up to 10 conditions in total',
                variant: 'destructive',
            });
            return;
        }

        setConditionGroups(conditionGroups.map(group =>
            group.id === groupId
                ? { ...group, conditions: [...group.conditions, createNewCondition(false)] }
                : group
        ));
    };

    const removeConditionFromGroup = (groupId: string, conditionId: string) => {
        setConditionGroups(conditionGroups.map(group => {
            if (group.id === groupId) {
                const updatedConditions = group.conditions.filter(c => c.id !== conditionId);
                // If no conditions left, remove the group
                if (updatedConditions.length === 0) {
                    return null;
                }
                // Update first condition to have no logic operator
                if (updatedConditions.length > 0) {
                    updatedConditions[0].logicOperator = undefined;
                }
                return { ...group, conditions: updatedConditions };
            }
            return group;
        }).filter(Boolean) as ConditionGroup[]);
    };

    const updateCondition = (
        groupId: string,
        conditionId: string,
        field: keyof ConditionRule,
        value: any
    ) => {
        setConditionGroups(conditionGroups.map(group =>
            group.id === groupId
                ? {
                    ...group,
                    conditions: group.conditions.map(condition =>
                        condition.id === conditionId
                            ? { ...condition, [field]: value }
                            : condition
                    )
                }
                : group
        ));
    };

    const toggleConditionLogicOperator = (groupId: string, conditionId: string) => {
        setConditionGroups(conditionGroups.map(group =>
            group.id === groupId
                ? {
                    ...group,
                    conditions: group.conditions.map(condition =>
                        condition.id === conditionId
                            ? { ...condition, logicOperator: condition.logicOperator === 'AND' ? 'OR' : 'AND' }
                            : condition
                    )
                }
                : group
        ));
    };

    const toggleGroupLogicOperator = (groupId: string) => {
        setConditionGroups(conditionGroups.map(group =>
            group.id === groupId
                ? { ...group, groupLogicOperator: group.groupLogicOperator === 'AND' ? 'OR' : 'AND' }
                : group
        ));
    };

    const validateConditions = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (conditionGroups.length === 0) {
            errors.push('At least one condition group is required');
        }

        conditionGroups.forEach((group, groupIdx) => {
            if (group.conditions.length === 0) {
                errors.push(`Group ${groupIdx + 1}: At least one condition is required`);
            }

            group.conditions.forEach((condition, condIdx) => {
                const prefix = `Group ${groupIdx + 1}, Condition ${condIdx + 1}`;
                if (!condition.variable) {
                    errors.push(`${prefix}: Variable is required`);
                }
                if (!condition.operator) {
                    errors.push(`${prefix}: Operator is required`);
                }
                if (condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && condition.value.length === 0) {
                    errors.push(`${prefix}: Value is required`);
                }
            });
        });

        return { isValid: errors.length === 0, errors };
    };

    const handleTestConditions = async () => {
        const { isValid, errors } = validateConditions();
        if (!isValid) {
            toast({
                title: 'Validation Error',
                description: errors[0],
                variant: 'destructive',
            });
            return;
        }

        // Simulate testing
        const results: { [key: string]: boolean } = {};
        conditionGroups.forEach(group => {
            group.conditions.forEach(condition => {
                results[condition.id] = Math.random() > 0.5;
            });
        });

        setTestResults(results);
        setShowTestPreview(true);

        toast({
            title: 'Test Complete',
            description: 'Condition testing completed successfully',
        });
    };

    const handleSave = () => {
        const { isValid, errors } = validateConditions();

        if (!isValid) {
            toast({
                title: 'Validation Error',
                description: errors[0],
                variant: 'destructive',
            });
            return;
        }

        // Save in group-based format with default output setting
        onSave({ conditionGroups, hasDefaultOutput });
        toast({
            title: 'Success',
            description: 'Condition groups saved successfully',
        });
        onClose();
    };

    const handleAddValue = (groupId: string, conditionId: string, newValue: string) => {
        if (!newValue.trim()) return;

        setConditionGroups(conditionGroups.map(group =>
            group.id === groupId
                ? {
                    ...group,
                    conditions: group.conditions.map(condition =>
                        condition.id === conditionId
                            ? { ...condition, value: [...condition.value, newValue.trim()] }
                            : condition
                    )
                }
                : group
        ));

        // Clear search input and close dropdown
        const key = `${groupId}-${conditionId}`;
        setSearchInputs(prev => ({ ...prev, [key]: '' }));
        setOpenDropdowns(prev => ({ ...prev, [key]: false }));
    };

    const handleRemoveValue = (groupId: string, conditionId: string, valueIndex: number) => {
        setConditionGroups(conditionGroups.map(group =>
            group.id === groupId
                ? {
                    ...group,
                    conditions: group.conditions.map(condition =>
                        condition.id === conditionId
                            ? { ...condition, value: condition.value.filter((_, idx) => idx !== valueIndex) }
                            : condition
                    )
                }
                : group
        ));
    };

    const getFilteredVariables = (groupId: string, conditionId: string) => {
        const key = `${groupId}-${conditionId}`;
        const searchTerm = searchInputs[key] || '';

        if (!searchTerm) return variables;

        return variables.filter(v =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const toggleDropdown = (groupId: string, conditionId: string) => {
        const key = `${groupId}-${conditionId}`;
        setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSearchChange = (groupId: string, conditionId: string, value: string) => {
        const key = `${groupId}-${conditionId}`;
        setSearchInputs(prev => ({ ...prev, [key]: value }));
        setOpenDropdowns(prev => ({ ...prev, [key]: true }));
    };

    const totalConditions = conditionGroups.reduce((sum, group) => sum + group.conditions.length, 0);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 border-slate-700">
                <SheetHeader>
                    <SheetTitle className="text-slate-100 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-amber-400" />
                        Configure Conditions
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Add logical with AND/OR operators. Maximum 10 Group per node.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Default Output Toggle */}
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-slate-200">Enable Default Output</Label>
                                <p className="text-xs text-slate-400">
                                    Add a fallback path for cases where none of the conditions are met
                                </p>
                            </div>
                            <Switch
                                checked={hasDefaultOutput}
                                onCheckedChange={setHasDefaultOutput}
                                className="data-[state=checked]:bg-amber-500"
                            />
                        </div>
                    </div>

                    {/* Condition Counter and Add Button */}
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-300">Total Conditions</span>
                            <Badge variant={totalConditions >= 10 ? 'destructive' : 'default'}>
                                {totalConditions} / 10
                            </Badge>
                        </div>
                        <Button
                            onClick={addGroup}
                            disabled={totalConditions >= 10}
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Group
                        </Button>
                    </div>

                    {/* Condition Groups */}
                    <div className="space-y-4">
                        {conditionGroups.map((group, groupIdx) => (
                            <div
                                key={group.id}
                                className="p-4 bg-slate-800/40 rounded-lg border-2 border-slate-700 space-y-3"
                            >
                                {/* Group Header with Logic Operator Toggle */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleGroupLogicOperator(group.id)}
                                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${group.groupLogicOperator === 'AND'
                                                ? 'bg-amber-500/30 text-amber-300 border-2 border-amber-500/50 hover:bg-amber-500/40'
                                                : 'bg-purple-500/30 text-purple-300 border-2 border-purple-500/50 hover:bg-purple-500/40'
                                                }`}
                                        >
                                            {group.groupLogicOperator || 'AND'}
                                        </button>

                                        <Layers className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-200">
                                            Group {groupIdx + 1}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {group.conditions.length} condition{group.conditions.length > 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addConditionToGroup(group.id)}
                                            disabled={totalConditions >= 10}
                                            className="h-7 px-2 text-xs hover:bg-green-900/20 text-green-400"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeGroup(group.id)}
                                            className="h-7 w-7 p-0 hover:bg-red-900/20 text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Conditions in Group */}
                                <div className="space-y-2 pl-2">
                                    {group.conditions.map((condition, condIdx) => (
                                        <div
                                            key={condition.id}
                                            className="p-3 bg-slate-800/60 rounded-lg border border-slate-600 space-y-3"
                                        >
                                            {/* Condition Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {condIdx > 0 && (
                                                        <button
                                                            onClick={() => toggleConditionLogicOperator(group.id, condition.id)}
                                                            className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${condition.logicOperator === 'AND'
                                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
                                                                }`}
                                                        >
                                                            {condition.logicOperator || 'AND'}
                                                        </button>
                                                    )}
                                                    <span className="text-xs font-medium text-slate-400">
                                                        Condition {condIdx + 1}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeConditionFromGroup(group.id, condition.id)}
                                                    className="h-6 w-6 p-0 hover:bg-red-900/20 text-red-400"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Variable Selection */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-400">Variable</Label>
                                                <Select
                                                    value={condition.variable}
                                                    onValueChange={(value) =>
                                                        updateCondition(group.id, condition.id, 'variable', value)
                                                    }
                                                >
                                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                                                        <SelectValue placeholder="Select variable" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700">
                                                        {variables.map((variable) => (
                                                            <SelectItem
                                                                key={variable.id}
                                                                value={variable.name}
                                                                className="text-slate-200"
                                                            >
                                                                {variable.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {!condition.variable && (
                                                    <p className="text-xs text-red-400 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Variable is required
                                                    </p>
                                                )}
                                            </div>

                                            {/* Operator Selection */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-400">Operator</Label>
                                                <Select
                                                    value={condition.operator}
                                                    onValueChange={(value: any) =>
                                                        updateCondition(group.id, condition.id, 'operator', value)
                                                    }
                                                >
                                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700">
                                                        {OPERATORS.map((op) => (
                                                            <SelectItem
                                                                key={op.value}
                                                                value={op.value}
                                                                className="text-slate-200"
                                                            >
                                                                {op.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Value Input */}
                                            {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && ((
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-400">Value</Label>

                                                    {/* Selected Values Display */}
                                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-800 border border-slate-700 rounded">
                                                        {condition.value.map((val, valIdx) => (
                                                            <Badge
                                                                key={valIdx}
                                                                variant="secondary"
                                                                className="bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                            >
                                                                {val}
                                                                <button
                                                                    onClick={() => handleRemoveValue(group.id, condition.id, valIdx)}
                                                                    className="ml-1 hover:text-red-400"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    {/* Searchable Dropdown */}
                                                    <div
                                                        className="relative"
                                                        ref={el => dropdownRefs.current[`${group.id}-${condition.id}`] = el}
                                                    >
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Search or type to create..."
                                                                value={searchInputs[`${group.id}-${condition.id}`] || ''}
                                                                onChange={(e) => handleSearchChange(group.id, condition.id, e.target.value)}
                                                                onFocus={() => toggleDropdown(group.id, condition.id)}
                                                                className="bg-slate-800 border-slate-700 text-slate-200 pr-8"
                                                            />
                                                            <ChevronDown
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                                                            />
                                                        </div>

                                                        {/* Dropdown Menu */}
                                                        {openDropdowns[`${group.id}-${condition.id}`] && (
                                                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                {(() => {
                                                                    const filtered = getFilteredVariables(group.id, condition.id);
                                                                    const searchTerm = searchInputs[`${group.id}-${condition.id}`] || '';
                                                                    const exactMatch = variables.find(v => v.name.toLowerCase() === searchTerm.toLowerCase());
                                                                    const showCreateOption = searchTerm && !exactMatch;

                                                                    return (
                                                                        <>
                                                                            {/* Variable Options */}
                                                                            {filtered.map((variable) => (
                                                                                <div
                                                                                    key={variable.id}
                                                                                    onClick={() => handleAddValue(group.id, condition.id, variable.name)}
                                                                                    className="px-4 py-2.5 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0"
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-sm text-slate-200">{variable.name}</span>
                                                                                        <span className="text-xs text-slate-500">System</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}

                                                                            {/* Create New Option */}
                                                                            {showCreateOption && (
                                                                                <div
                                                                                    onClick={() => handleAddValue(group.id, condition.id, searchTerm)}
                                                                                    className="px-4 py-2.5 hover:bg-slate-700 cursor-pointer transition-colors border-t border-slate-600"
                                                                                >
                                                                                    <span className="text-sm text-slate-200">
                                                                                        Create "{searchTerm}"
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {/* No Results */}
                                                                            {filtered.length === 0 && !showCreateOption && (
                                                                                <div className="px-4 py-2.5 text-sm text-slate-500 text-center">
                                                                                    No variables found
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {condition.value.length === 0 && (
                                                        <p className="text-xs text-red-400 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            At least one value is required
                                                        </p>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Test Result */}
                                            {showTestPreview && testResults[condition.id] !== undefined && (
                                                <div className={`p-2 rounded text-xs flex items-center gap-2 ${testResults[condition.id]
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    <Check className="h-3.5 w-3.5" />
                                                    Test Result: {testResults[condition.id] ? 'Passed' : 'Failed'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Footer with Cancel and Save Changes Buttons */}
                    <div className="flex-shrink-0 p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm">
                        <p className="text-xs text-slate-400 text-center italic">
                            Changes are saved automatically. Click the Save button in the toolbar to persist your flow.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
