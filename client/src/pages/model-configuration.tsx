import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, RefreshCw, X, GripVertical, Check, ChevronsUpDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { cn } from '@/lib/utils';

interface ModelConfigurationProps {
    workspaceId: string;
}

interface ModelConfig {
    teacher: string[];
    coder: string[];
    summarizer: string[];
    creative: string[];
    fact_checker: string[];
    general: string[];
}

interface Model {
    id: string;
    name: string;
}

const CATEGORIES = [
    { key: 'teacher', label: 'Teacher', description: 'Models optimized for educational content and explanations' },
    { key: 'coder', label: 'Coder', description: 'Models specialized in code generation and debugging' },
    { key: 'summarizer', label: 'Summarizer', description: 'Models that excel at text summarization' },
    { key: 'creative', label: 'Creative', description: 'Models for creative writing and content generation' },
    { key: 'fact_checker', label: 'Fact Checker', description: 'Models with web search for fact verification' },
    { key: 'general', label: 'General', description: 'General purpose models for various tasks' }
];

export default function ModelConfiguration({ workspaceId }: ModelConfigurationProps) {
    const [config, setConfig] = useState<ModelConfig>({
        teacher: [],
        coder: [],
        summarizer: [],
        creative: [],
        fact_checker: [],
        general: []
    });
    const [modelSearchOpen, setModelSearchOpen] = useState<{ [key: string]: boolean }>({
        teacher: false,
        coder: false,
        summarizer: false,
        creative: false,
        fact_checker: false,
        general: false
    });
    const { toast } = useToast();
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // Fetch available models with caching
    const { data: availableModels = [], isLoading: modelsLoading } = useQuery<Model[]>({
        queryKey: ['available-models'],
        queryFn: async () => {
            const response = await fetch('/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }
            const data = await response.json();
            return data.data?.map((model: any) => ({
                id: model.id,
                name: model.name || model.id
            })) || [];
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        enabled: !!token,
    });

    // Fetch model configuration with caching
    const { data: modelConfig, isLoading: configLoading, error: configError } = useQuery<ModelConfig>({
        queryKey: ['model-config', workspaceId],
        queryFn: async () => {
            const response = await fetch('/api/workspace/model-config', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch model configuration');
            }
            const data = await response.json();
            return data.model_config;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        enabled: !!token,
    });

    // Show error toast if config fetch fails
    useEffect(() => {
        if (configError) {
            console.error('Error fetching model config:', configError);
            toast({
                title: 'Error',
                description: 'Failed to load model configuration',
                variant: 'destructive'
            });
        }
    }, [configError, toast]);

    // Update local state when cached data changes
    useEffect(() => {
        if (modelConfig) {
            setConfig(modelConfig);
        }
    }, [modelConfig]);

    // Save configuration mutation
    const saveMutation = useMutation({
        mutationFn: async (newConfig: ModelConfig) => {
            const response = await fetch('/api/workspace/model-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ model_config: newConfig }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save configuration');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch the model config cache
            queryClient.invalidateQueries({ queryKey: ['model-config', workspaceId] });
            toast({
                title: 'Success',
                description: 'Model configuration saved successfully',
            });
        },
        onError: (error: any) => {
            console.error('Error saving model config:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save model configuration',
                variant: 'destructive'
            });
        }
    });

    const handleSave = () => {
        // Validate that each category has at least 2 models
        const invalidCategories = CATEGORIES.filter(category => {
            const models = config[category.key as keyof ModelConfig];
            return models && models.length > 0 && models.length < 2;
        });

        if (invalidCategories.length > 0) {
            toast({
                title: 'Validation Error',
                description: `Each category must have at least 2 models. Please add more models to: ${invalidCategories.map(c => c.label).join(', ')}`,
                variant: 'destructive'
            });
            return;
        }

        saveMutation.mutate(config);
    };

    // Reset configuration mutation
    const resetMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/workspace/model-config', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reset configuration');
            }
            return response.json();
        },
        onSuccess: (data) => {
            // Update cache with default configuration
            queryClient.setQueryData(['model-config', workspaceId], data.model_config);
            setConfig(data.model_config);
            toast({
                title: 'Success',
                description: 'Model configuration reset to defaults',
            });
        },
        onError: (error: any) => {
            console.error('Error resetting model config:', error);
            toast({
                title: 'Error',
                description: 'Failed to reset model configuration',
                variant: 'destructive'
            });
        }
    });

    const handleReset = () => {
        resetMutation.mutate();
    };

    const handleModelChange = (category: keyof ModelConfig, selectedModels: string[]) => {
        setConfig(prev => ({
            ...prev,
            [category]: selectedModels
        }));
    };

    const handleDragStart = (e: React.DragEvent, category: keyof ModelConfig, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ category, index }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, category: keyof ModelConfig, dropIndex: number) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const { category: dragCategory, index: dragIndex } = data;

        // Only allow reordering within the same category
        if (dragCategory !== category) return;

        const items = [...config[category]];
        const [draggedItem] = items.splice(dragIndex, 1);
        items.splice(dropIndex, 0, draggedItem);

        handleModelChange(category, items);
    };

    const loading = modelsLoading || configLoading;
    const saving = saveMutation.isPending || resetMutation.isPending;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Model Configuration</h2>
                <p className="text-slate-400">
                    Configure AI models for specific task categories to optimize performance and responses.
                </p>
            </div>

            <div className="space-y-6">
                {/* Category Configuration Section */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="border-b border-slate-700 px-6 py-4 bg-slate-800/80">
                        <h3 className="font-semibold text-lg">Category-Based Model Selection</h3>
                    </div>

                    <div className="divide-y divide-slate-700">
                        {CATEGORIES.map((category) => (
                            <div key={category.key} className="p-6 hover:bg-slate-800/30 transition-colors">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div>
                                        <label className="text-sm font-medium text-slate-200 mb-1 block">
                                            {category.label}
                                        </label>
                                        <p className="text-xs text-slate-400">
                                            {category.description}
                                        </p>
                                    </div>
                                    <div>
                                        <Popover 
                                            open={modelSearchOpen[category.key as keyof ModelConfig]} 
                                            onOpenChange={(open) => 
                                                setModelSearchOpen(prev => ({ ...prev, [category.key]: open }))
                                            }
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={modelSearchOpen[category.key as keyof ModelConfig]}
                                                    className="w-full justify-between bg-slate-800 border-slate-600 hover:bg-slate-700 font-normal"
                                                >
                                                    <span className="truncate text-slate-300">
                                                        Select models...
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-[320px] p-0 bg-slate-800 border-slate-600"
                                                align="start"
                                                sideOffset={4}
                                            >
                                                <Command className="bg-slate-800" shouldFilter={true}>
                                                    <CommandInput
                                                        placeholder="Search models..."
                                                        className="h-9 border-none bg-slate-800 text-white placeholder:text-slate-500"
                                                    />
                                                    <CommandList
                                                        className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
                                                        style={{
                                                            overscrollBehavior: 'contain',
                                                            WebkitOverflowScrolling: 'touch',
                                                        }}
                                                        onWheel={(e) => e.stopPropagation()}
                                                    >
                                                        <CommandEmpty className="py-6 text-center text-sm text-slate-400">
                                                            No model found.
                                                        </CommandEmpty>
                                                        <CommandGroup className="bg-slate-800 p-1">
                                                            {availableModels.map((model: Model) => {
                                                                const isSelected = config[category.key as keyof ModelConfig].includes(model.id);
                                                                return (
                                                                    <CommandItem
                                                                        key={model.id}
                                                                        value={model.name}
                                                                        onSelect={() => {
                                                                            const currentValues = config[category.key as keyof ModelConfig];
                                                                            if (!currentValues.includes(model.id)) {
                                                                                handleModelChange(
                                                                                    category.key as keyof ModelConfig,
                                                                                    [...currentValues, model.id]
                                                                                );
                                                                            }
                                                                            setModelSearchOpen(prev => ({ ...prev, [category.key]: false }));
                                                                        }}
                                                                        className="hover:bg-slate-700 cursor-pointer text-white aria-selected:bg-slate-700 px-2 py-1.5"
                                                                        disabled={isSelected}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4 flex-shrink-0',
                                                                                isSelected ? 'opacity-100 text-indigo-400' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <div className="flex flex-col flex-1 min-w-0">
                                                                            <span className="text-sm truncate">{model.name}</span>
                                                                            <span className="text-xs text-slate-500 truncate">{model.id}</span>
                                                                        </div>
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {config[category.key as keyof ModelConfig]?.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {config[category.key as keyof ModelConfig].length === 1 && (
                                                    <div className="px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 mb-2">
                                                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                                                            <Info className="h-3 w-3" />
                                                            <span>Minimum 2 models required. Please add at least one more model.</span>
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-400 font-medium">
                                                    Priority Order (drag to reorder):
                                                </p>
                                                <div className="space-y-2">
                                                    {config[category.key as keyof ModelConfig].map((modelId, index) => {
                                                        const model = availableModels.find((m: Model) => m.id === modelId);
                                                        return model ? (
                                                            <div
                                                                key={modelId}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, category.key as keyof ModelConfig, index)}
                                                                onDragOver={handleDragOver}
                                                                onDrop={(e) => handleDrop(e, category.key as keyof ModelConfig, index)}
                                                                className="group flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-move"
                                                            >
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <GripVertical className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" />
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                                                                            {index + 1}
                                                                        </span>
                                                                        <span className="text-sm text-slate-200">
                                                                            {model.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const currentModels = config[category.key as keyof ModelConfig];
                                                                        // Prevent removing if only 2 models remain
                                                                        if (currentModels.length <= 2) {
                                                                            toast({
                                                                                title: 'Cannot Remove',
                                                                                description: 'Each category must have at least 2 models. Add more models before removing this one.',
                                                                                variant: 'destructive'
                                                                            });
                                                                            return;
                                                                        }
                                                                        handleModelChange(
                                                                            category.key as keyof ModelConfig,
                                                                            config[category.key as keyof ModelConfig].filter(id => id !== modelId)
                                                                        );
                                                                    }}
                                                                    className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                    <Button
                        onClick={handleReset}
                        disabled={saving}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-800"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset to Defaults
                    </Button>
                </div>

                {/* Information Section */}
                <Alert className="bg-slate-800/50 border-slate-700">
                    <Info className="h-4 w-4 text-indigo-400" />
                    <AlertDescription className="text-slate-300 mt-2">
                        <div className="space-y-2">
                            <p className="font-semibold text-sm">Model Selection Reference:</p>
                            <ul className="space-y-1 text-sm text-slate-400">
                                <li>
                                    <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300">
                                        nexus/auto
                                    </code>
                                    <span className="ml-2">→ Model is decided automatically as per best available model.</span>
                                </li>
                                <li>
                                    <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300">
                                        nexus/auto:teacher
                                    </code>
                                    <span className="ml-2">→ Only teacher-related model will be used automatically.</span>
                                </li>
                                <li>
                                    <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300">
                                        nexus/auto:intent
                                    </code>
                                    <span className="ml-2">→ Model is selected automatically based on given user prompt.</span>
                                </li>
                                <li className="pt-2 border-t border-slate-700 mt-2">
                                    <span className="font-semibold text-yellow-400">⚠️ Validation:</span>
                                    <span className="ml-2">Each category must have at least 2 models for fallback support.</span>
                                </li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
