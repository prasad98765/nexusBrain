import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Search,
    ChevronDown,
    Grid3x3,
    List,
    RotateCcw,
    Gift,
    MonitorPlay,
    Cpu,
    DollarSign,
    Grid2x2,
    Tag,
    Code2,
    Building2,
    Share2,
    Copy,
    Check,
    ArrowLeft,
    MessageSquare
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import llmData from '@shared/llm_details.json';

interface Model {
    id: string;
    canonical_slug?: string;
    name: string;
    created: number;
    description: string;
    context_length: number;
    architecture: {
        modality: string;
        input_modalities: string[];
        output_modalities: string[];
        tokenizer: string;
    };
    pricing: {
        prompt: string;
        completion: string;
    };
    supported_parameters: string[];
}

type ViewMode = 'table' | 'card';
type SortMode = 'newest' | 'price-low' | 'price-high' | 'context-high';

const ModelDetailsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [sortMode, setSortMode] = useState<SortMode>('newest');
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const { toast } = useToast();

    // Filter states
    const [selectedInputModalities, setSelectedInputModalities] = useState<string[]>([]);
    const [selectedOutputModalities, setSelectedOutputModalities] = useState<string[]>([]);
    const [contextRange, setContextRange] = useState<[number, number]>([0, 1000000]);
    const [pricingRange, setPricingRange] = useState<[number, number]>([0, 20]);
    const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
    const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const models: Model[] = useMemo(() => llmData.data as Model[], []);

    // Extract unique values for filters
    const filterOptions = useMemo(() => {
        const inputModalities = new Set<string>();
        const outputModalities = new Set<string>();
        const series = new Set<string>();
        const parameters = new Set<string>();
        const providers = new Set<string>();

        models.forEach(model => {
            model.architecture.input_modalities.forEach(mod => inputModalities.add(mod));
            model.architecture.output_modalities.forEach(mod => outputModalities.add(mod));
            series.add(model.architecture.tokenizer);
            model.supported_parameters?.forEach(param => parameters.add(param));

            // Extract provider from id
            const provider = model.id.split('/')[0];
            if (provider) providers.add(provider);
        });

        return {
            inputModalities: Array.from(inputModalities).sort(),
            outputModalities: Array.from(outputModalities).sort(),
            series: Array.from(series).sort(),
            parameters: Array.from(parameters).sort(),
            providers: Array.from(providers).sort()
        };
    }, [models]);

    // Load filters from URL on mount
    useEffect(() => {
        const inputMods = searchParams.get('input')?.split(',').filter(Boolean) || [];
        const outputMods = searchParams.get('output')?.split(',').filter(Boolean) || [];
        const seriesParam = searchParams.get('series')?.split(',').filter(Boolean) || [];
        const paramsParam = searchParams.get('params')?.split(',').filter(Boolean) || [];
        const providersParam = searchParams.get('providers')?.split(',').filter(Boolean) || [];
        const contextMin = searchParams.get('context_min');
        const priceMin = searchParams.get('price_min');
        const priceMax = searchParams.get('price_max');

        setSelectedInputModalities(inputMods);
        setSelectedOutputModalities(outputMods);
        setSelectedSeries(seriesParam);
        setSelectedParameters(paramsParam);
        setSelectedProviders(providersParam);

        if (contextMin) setContextRange([parseInt(contextMin), 1048576]);
        if (priceMin && priceMax) setPricingRange([parseFloat(priceMin), parseFloat(priceMax)]);
    }, []);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedInputModalities.length) params.set('input', selectedInputModalities.join(','));
        if (selectedOutputModalities.length) params.set('output', selectedOutputModalities.join(','));
        if (selectedSeries.length) params.set('series', selectedSeries.join(','));
        if (selectedParameters.length) params.set('params', selectedParameters.join(','));
        if (selectedProviders.length) params.set('providers', selectedProviders.join(','));
        if (contextRange[0] > 0) params.set('context_min', contextRange[0].toString());
        if (pricingRange[0] > 0 || pricingRange[1] < 20) {
            params.set('price_min', pricingRange[0].toString());
            params.set('price_max', pricingRange[1].toString());
        }

        setSearchParams(params, { replace: true });
    }, [selectedInputModalities, selectedOutputModalities, selectedSeries, selectedParameters, selectedProviders, contextRange, pricingRange]);

    // Filter and sort models
    const filteredModels = useMemo(() => {
        let filtered = models.filter(model => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!model.name.toLowerCase().includes(query) &&
                    !model.id.toLowerCase().includes(query) &&
                    !model.description.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Input modalities filter
            if (selectedInputModalities.length > 0) {
                if (!selectedInputModalities.some(mod => model.architecture.input_modalities.includes(mod))) {
                    return false;
                }
            }

            // Output modalities filter
            if (selectedOutputModalities.length > 0) {
                if (!selectedOutputModalities.some(mod => model.architecture.output_modalities.includes(mod))) {
                    return false;
                }
            }

            // Context length filter
            if (model.context_length < contextRange[0] || model.context_length > contextRange[1]) {
                return false;
            }

            // Pricing filter
            const promptPrice = parseFloat(model.pricing.prompt) * 1000000; // Convert to per million
            const completionPrice = parseFloat(model.pricing.completion) * 1000000;
            if (completionPrice < pricingRange[0] || completionPrice > pricingRange[1]) {
                return false;
            }

            // Series filter
            if (selectedSeries.length > 0 && !selectedSeries.includes(model.architecture.tokenizer)) {
                return false;
            }

            // Parameters filter
            if (selectedParameters.length > 0) {
                if (!selectedParameters.some(param => model.supported_parameters?.includes(param))) {
                    return false;
                }
            }

            // Provider filter
            if (selectedProviders.length > 0) {
                const provider = model.id.split('/')[0];
                if (!selectedProviders.includes(provider)) {
                    return false;
                }
            }

            return true;
        });

        // Sort
        switch (sortMode) {
            case 'newest':
                filtered.sort((a, b) => b.created - a.created);
                break;
            case 'price-low':
                filtered.sort((a, b) => parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt));
                break;
            case 'price-high':
                filtered.sort((a, b) => parseFloat(b.pricing.prompt) - parseFloat(a.pricing.prompt));
                break;
            case 'context-high':
                filtered.sort((a, b) => b.context_length - a.context_length);
                break;
        }

        return filtered;
    }, [models, searchQuery, selectedInputModalities, selectedOutputModalities, contextRange, pricingRange, selectedSeries, selectedParameters, selectedProviders, sortMode]);

    const resetFilters = () => {
        setSelectedInputModalities([]);
        setSelectedOutputModalities([]);
        setContextRange([0, 1048576]);
        setPricingRange([0, 20]);
        setSelectedSeries([]);
        setSelectedParameters([]);
        setSelectedProviders([]);
        setSearchParams({});
    };

    const handleShareUrl = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast({
            title: 'URL Copied!',
            description: 'Share this filtered view with your team.',
        });
    };

    const handleCopyModelId = (canonical_slug: string, modelId: string) => {
        const textToCopy = canonical_slug || modelId;
        navigator.clipboard.writeText(textToCopy);
        setCopiedId(modelId);
        setTimeout(() => setCopiedId(null), 2000);
        toast({
            title: 'Copied!',
            description: `Model ID copied: ${textToCopy}`,
        });
    };

    const hasActiveFilters = selectedInputModalities.length > 0 ||
        selectedOutputModalities.length > 0 ||
        selectedSeries.length > 0 ||
        selectedParameters.length > 0 ||
        selectedProviders.length > 0;

    const formatPrice = (price: string) => {
        const num = parseFloat(price) * 1000000;
        return num === 0 ? '$0' : `$${num.toFixed(2)}`;
    };

    const formatContextLength = (length: number) => {
        if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M tokens`;
        if (length >= 1000) return `${(length / 1000).toFixed(0)}K tokens`;
        return `${length} tokens`;
    };

    const getProviderName = (id: string) => id.split('/')[0];

    // If a model is selected, show detail view
    if (selectedModel) {
        return <ModelDetailView model={selectedModel} onBack={() => setSelectedModel(null)} formatPrice={formatPrice} formatContextLength={formatContextLength} getProviderName={getProviderName} />;
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white">
            {/* Left Sidebar - Filters */}
            <div className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50">
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {/* Filter Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">Filters</h3>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Reset
                                </Button>
                            )}
                        </div>

                        {/* Total Models Count */}
                        <div className="text-xs text-slate-400 pb-2 border-b border-slate-800">
                            {filteredModels.length} models found
                        </div>

                        {/* Input Modalities Filter */}
                        <FilterSection
                            icon={<MonitorPlay className="w-4 h-4" />}
                            title="Input Modalities"
                            options={filterOptions.inputModalities}
                            selected={selectedInputModalities}
                            onChange={setSelectedInputModalities}
                        />

                        {/* Output Modalities Filter */}
                        <FilterSection
                            icon={<MonitorPlay className="w-4 h-4" />}
                            title="Output Modalities"
                            options={filterOptions.outputModalities}
                            selected={selectedOutputModalities}
                            onChange={setSelectedOutputModalities}
                        />

                        {/* Context Length Filter - Range Slider */}
                        <Collapsible defaultOpen className="space-y-3">
                            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-white transition-colors">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4" />
                                    <span className="text-sm font-medium">Context length</span>
                                </div>
                                <ChevronDown className="w-4 h-4 transition-transform" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 pb-2">
                                {/* Current Value Display */}
                                <div className="text-xs text-slate-300 font-medium">
                                    Min: {formatContextLength(contextRange[0])}
                                </div>

                                <div className="relative pt-2">
                                    <Slider
                                        value={[contextRange[0]]}
                                        onValueChange={(value) => setContextRange([value[0], 1048576])}
                                        min={0}
                                        max={1048576}
                                        step={4096}
                                        className="w-full"
                                    />
                                    {/* Tick marks */}
                                    <div className="absolute top-6 left-0 right-0 flex justify-between px-0.5">
                                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="w-0.5 h-2 bg-slate-600" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2">
                                    <span>4K</span>
                                    <span>64K</span>
                                    <span>1M</span>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Prompt Pricing Filter - Range Slider */}
                        <Collapsible defaultOpen className="space-y-3">
                            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-white transition-colors">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-sm font-medium">Prompt pricing</span>
                                </div>
                                <ChevronDown className="w-4 h-4 transition-transform" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 pb-2">
                                {/* Current Value Display */}
                                <div className="text-xs text-slate-300 font-medium">
                                    ${pricingRange[0].toFixed(2)} - ${pricingRange[1].toFixed(2)} per 1M tokens
                                </div>

                                <div className="relative pt-2">
                                    <Slider
                                        value={pricingRange}
                                        onValueChange={(value) => setPricingRange([value[0], value[1]])}
                                        min={0}
                                        max={20}
                                        step={0.1}
                                        className="w-full"
                                    />
                                    {/* Tick marks */}
                                    <div className="absolute top-6 left-0 right-0 flex justify-between px-0.5">
                                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="w-0.5 h-2 bg-slate-600" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2">
                                    <span>FREE</span>
                                    <span>$0.5</span>
                                    <span>$10+</span>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Series Filter */}
                        <FilterSection
                            icon={<Grid2x2 className="w-4 h-4" />}
                            title="Series"
                            options={filterOptions.series}
                            selected={selectedSeries}
                            onChange={setSelectedSeries}
                        />

                        {/* Supported Parameters Filter */}
                        <FilterSection
                            icon={<Code2 className="w-4 h-4" />}
                            title="Supported Parameters"
                            options={filterOptions.parameters.slice(0, 20)}
                            selected={selectedParameters}
                            onChange={setSelectedParameters}
                            collapsible
                        />

                        {/* Providers Filter */}
                        <FilterSection
                            icon={<Building2 className="w-4 h-4" />}
                            title="Providers"
                            options={filterOptions.providers.slice(0, 30)}
                            selected={selectedProviders}
                            onChange={setSelectedProviders}
                            collapsible
                        />
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="border-b border-slate-800 p-6 bg-slate-900/50">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold">Models</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">{filteredModels.length} models</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShareUrl}
                                className="border-slate-700 hover:bg-slate-800"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Search and Controls */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Filter models"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-slate-500"
                            />
                        </div>

                        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                            <SelectTrigger className="w-48 bg-[rgb(15 23 42 / 0.5)] border-[#2a2a2a]">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="price-low">Price: Low → High</SelectItem>
                                <SelectItem value="price-high">Price: High → Low</SelectItem>
                                <SelectItem value="context-high">Context: High → Low</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1 bg-[rgb(15 23 42 / 0.5)] border border-[#2a2a2a] rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('table')}
                                className={viewMode === 'table' ? 'bg-[var(--primary)]' : ''}
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('card')}
                                className={viewMode === 'card' ? 'bg-[var(--primary)]' : ''}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Models List */}
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {viewMode === 'table' ? (
                            <TableView models={filteredModels} formatPrice={formatPrice} formatContextLength={formatContextLength} getProviderName={getProviderName} onSelectModel={setSelectedModel} />
                        ) : (
                            <CardView models={filteredModels} formatPrice={formatPrice} formatContextLength={formatContextLength} getProviderName={getProviderName} handleCopyModelId={handleCopyModelId} copiedId={copiedId} onSelectModel={setSelectedModel} />
                        )}

                        {filteredModels.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-slate-400">No models found matching your filters</p>
                                <Button onClick={resetFilters} variant="outline" className="mt-4">
                                    Reset Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

// Model Detail View Component
const ModelDetailView = ({ model, onBack, formatPrice, formatContextLength, getProviderName }: {
    model: Model;
    onBack: () => void;
    formatPrice: (price: string) => string;
    formatContextLength: (length: number) => string;
    getProviderName: (id: string) => string;
}) => {
    const isFree = parseFloat(model.pricing.prompt) === 0 && parseFloat(model.pricing.completion) === 0;
    const [copiedId, setCopiedId] = useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(model.canonical_slug || model.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleChat = () => {
        // Navigate to chat playground with this model pre-selected
        window.location.href = `/chat-playground?model=${encodeURIComponent(model.id)}`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header with Back Button */}
            <div className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="mb-4 hover:bg-slate-800 text-slate-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Models
                    </Button>
                </div>
            </div>

            {/* Model Details Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Title and Actions */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-bold">{model.name}</h1>
                            {isFree && (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                                    <Gift className="w-4 h-4 mr-1" />
                                    free
                                </Badge>
                            )}
                        </div>

                        {/* Model ID with Copy */}
                        <div className="flex items-center gap-2 mb-4">
                            <code className="text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded">
                                {model.canonical_slug || model.id}
                            </code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyId}
                                className="h-7 hover:bg-slate-800"
                            >
                                {copiedId ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-slate-400" />
                                )}
                            </Button>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            <span>Created {new Date(model.created * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{formatContextLength(model.context_length)} context</span>
                            <span>•</span>
                            <span>{formatPrice(model.pricing.prompt)}/M input tokens</span>
                            <span>•</span>
                            <span>{formatPrice(model.pricing.completion)}/M output tokens</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-6">
                        <Button
                            onClick={handleChat}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                        </Button>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6 mb-6">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {model.description}
                    </p>
                </div>

                {/* Additional Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Provider Info */}
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Provider</h3>
                        <p className="text-white">{getProviderName(model.id)}</p>
                    </div>

                    {/* Modality */}
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Modality</h3>
                        <p className="text-white">{model.architecture.modality}</p>
                    </div>

                    {/* Input Modalities */}
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Input Modalities</h3>
                        <div className="flex flex-wrap gap-2">
                            {model.architecture.input_modalities.map(mod => (
                                <Badge key={mod} variant="outline" className="border-slate-700 text-slate-300">
                                    {mod}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Output Modalities */}
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Output Modalities</h3>
                        <div className="flex flex-wrap gap-2">
                            {model.architecture.output_modalities.map(mod => (
                                <Badge key={mod} variant="outline" className="border-slate-700 text-slate-300">
                                    {mod}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Tokenizer/Series */}
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Series</h3>
                        <p className="text-white">{model.architecture.tokenizer}</p>
                    </div>

                    {/* Context Length */}
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Context Length</h3>
                        <p className="text-white">{model.context_length.toLocaleString()} tokens</p>
                    </div>
                </div>

                {/* Supported Parameters */}
                {model.supported_parameters && model.supported_parameters.length > 0 && (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 mt-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Supported Parameters</h3>
                        <div className="flex flex-wrap gap-2">
                            {model.supported_parameters.map(param => (
                                <Badge key={param} variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">
                                    {param}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
const FilterSection = ({
    icon,
    title,
    options,
    selected,
    onChange,
    collapsible = false
}: {
    icon: React.ReactNode;
    title: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    collapsible?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(!collapsible);
    const displayOptions = collapsible && !isOpen ? options.slice(0, 5) : options;

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-white transition-colors">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-1">
                {displayOptions.map(option => (
                    <label key={option} className="flex items-center gap-2 py-1 cursor-pointer hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={selected.includes(option)}
                            onChange={() => toggleOption(option)}
                            className="rounded border-[#2a2a2a] bg-[#1a1a1a]"
                        />
                        <span className="text-sm text-slate-300">{option}</span>
                    </label>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};

// Table View Component
const TableView = ({ models, formatPrice, formatContextLength, getProviderName, onSelectModel }: any) => {
    return (
        <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-[rgb(15 23 42 / 0.5)] border-b border-[#1f1f1f]">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Model Name & ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Input ($/1M tokens)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Output ($/1M tokens)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Context (tokens)</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((model: Model) => (
                        <tr key={model.id} className="border-b border-[#1f1f1f] hover:bg-[rgb(15 23 42 / 0.5)] transition-colors">
                            <td className="px-4 py-4">
                                <div>
                                    <button
                                        onClick={() => onSelectModel(model)}
                                        className="font-medium text-white hover:text-indigo-400 transition-colors mb-1 text-left"
                                    >
                                        {model.name}
                                    </button>
                                    <div className="text-xs text-slate-500 font-mono">{model.id}</div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">{formatPrice(model.pricing.prompt)}</td>
                            <td className="px-4 py-4 text-sm text-slate-300">{formatPrice(model.pricing.completion)}</td>
                            <td className="px-4 py-4 text-sm text-slate-300">{model.context_length.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Card View Component - ADD COPY BUTTON
const CardView = ({ models, formatPrice, formatContextLength, getProviderName, handleCopyModelId, copiedId, onSelectModel }: any) => {
    return (
        <div className="space-y-4">
            {models.map((model: Model) => {
                const isFree = parseFloat(model.pricing.prompt) === 0 && parseFloat(model.pricing.completion) === 0;

                return (
                    <div
                        key={model.id}
                        className="border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors bg-slate-900/30"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={() => onSelectModel(model)}
                                        className="text-lg font-semibold text-white hover:text-indigo-400 transition-colors text-left"
                                    >
                                        {model.name}
                                    </button>
                                    {isFree && (
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                                            <Gift className="w-3 h-3 mr-1" />
                                            free
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyModelId(model.canonical_slug, model.id);
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-slate-800"
                                    >
                                        {copiedId === model.id ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{model.description}</p>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                    <span>by {getProviderName(model.id)}</span>
                                    <span>{formatContextLength(model.context_length)} context</span>
                                    <span>{formatPrice(model.pricing.prompt)}/M input tokens</span>
                                    <span>{formatPrice(model.pricing.completion)}/M output tokens</span>
                                </div>
                            </div>

                            <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-slate-300">{formatContextLength(model.context_length)}</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ModelDetailsPage;
