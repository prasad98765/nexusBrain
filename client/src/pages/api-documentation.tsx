import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useModelStore } from '@/store/modelStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ExternalLink,
  Code,
  BookOpen,
  Key,
  Zap,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Play,
  Search,
  Info,
  Layers,
  Filter,
  TrendingUp,
  Database
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Model {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
}

interface Provider {
  name: string;
  slug: string;
  privacy_policy_url?: string;
  status_page_url?: string;
  terms_of_service_url?: string;
}

export default function ApiDocumentation() {
  const [activeEndpoint, setActiveEndpoint] = useState('completions');
  const { models, providers, fetchModelsAndProviders } = useModelStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [isLlmDetailsOpen, setIsLlmDetailsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [costSort, setCostSort] = useState('none');
  const [showPopular, setShowPopular] = useState(false);
  const isMobile = useIsMobile()

  const handleTryIt = () => {
    // Navigate to the API testing route
    window.location.href = '/docs/api-reference/test';
  };

  const { token } = useAuth();

  useEffect(() => {
    if (isLlmDetailsOpen && models.length === 0 && token) {
      setLoadingModels(true);
      fetchModelsAndProviders(token)
        .catch((error) => {
          console.error('Failed to fetch models:', error);
          // You might want to add a toast notification here
        })
        .finally(() => {
          setLoadingModels(false);
        });
    }
  }, [isLlmDetailsOpen, models.length, fetchModelsAndProviders, token]);

  const filteredModels = models.filter((model: any) => {
    // Search filter
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Provider filter
    const providerSlug = model.id.split('/')[0];
    const matchesProvider = selectedProvider === 'all' || providerSlug === selectedProvider;

    return matchesSearch && matchesProvider;
  });

  const sortedModels = [...filteredModels].sort((a, b) => {
    if (costSort === 'low-to-high') {
      const aPrice = parseFloat(a.pricing?.prompt || '0');
      const bPrice = parseFloat(b.pricing?.prompt || '0');
      return aPrice - bPrice;
    } else if (costSort === 'high-to-low') {
      const aPrice = parseFloat(a.pricing?.prompt || '0');
      const bPrice = parseFloat(b.pricing?.prompt || '0');
      return bPrice - aPrice;
    }
    return 0;
  });

  const getProviderInfo = (modelId: string) => {
    const providerSlug = modelId.split('/')[0];
    console.log("providerSlug", providerSlug);

    return providers.find(p => p.slug.includes(providerSlug.toLowerCase()));
  };

  // Group models by provider for accordion display
  const modelsByProvider = sortedModels.reduce((acc, model: any) => {
    const providerSlug = model.id.split('/')[0];
    if (!acc[providerSlug]) {
      acc[providerSlug] = [];
    }
    acc[providerSlug].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  // Get unique providers from filtered models
  const availableProviders = Array.from(new Set(models.map(m => m.id.split('/')[0])));

  const getProviderDisplayName = (slug: string) => {
    const provider = providers.find(p => p.slug === slug);
    return provider?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
  };



  const completionsParams = [
    { param: 'model', purpose: 'The ID of the model to use. See the model endpoint compatibility table for details on which models work with the Chat API.', required: true },
    { param: 'prompt', purpose: 'The prompt(s) to generate completions for, encoded as a string, array of strings, array of tokens, or array of token arrays.', required: true },
    { param: 'max_tokens', purpose: 'The maximum number of tokens that can be generated in the chat completion.', required: false },
    { param: 'temperature', purpose: 'What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.', required: false },
    // { param: 'top_p', purpose: 'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass.', required: false },
    // { param: 'n', purpose: 'How many completions to generate for each prompt.', required: false },
    { param: 'stream', purpose: 'Whether to stream back partial progress. If set, tokens will be sent as data-only server-sent events as they become available.', required: false },
    {
      param: 'cache_threshold',
      purpose: 'Set the similarity threshold (between 0.1 and 0.99) above which cached entries are returned instead of calling the LLM.',
      required: false
    },

    {
      param: 'is_cached',
      purpose: 'Return a cached answer if available and store your question for future caching.',
      required: false
    }

    // { param: 'echo', purpose: 'Echo back the prompt in addition to the completion.', required: false },
    // { param: 'stop', purpose: 'Up to 4 sequences where the API will stop generating further tokens. The returned text will not contain the stop sequence.', required: false },
    // { param: 'presence_penalty', purpose: 'Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far.', required: false },
    // { param: 'frequency_penalty', purpose: 'Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far.', required: false },
    // { param: 'best_of', purpose: 'Generates best_of completions server-side and returns the "best" (the one with the highest log probability per token).', required: false },
    // { param: 'logit_bias', purpose: 'Modify the likelihood of specified tokens appearing in the completion.', required: false },
    // { param: 'user', purpose: 'A unique identifier representing your end-user, which can help OpenRouter to monitor and detect abuse.', required: false },
    // { param: 'suffix', purpose: 'The suffix that comes after a completion of inserted text.', required: false }
  ];

  const chatParams = [
    { param: 'model', purpose: 'ID of the model to use. See the model endpoint compatibility table for details on which models work with the Chat API.', required: true },
    { param: "messages", purpose: "An ordered list of role-based message objects forming the conversation history; each object must include a 'role' (system, developer, user, assistant, tool) and a 'content' string.", required: true },
    { param: 'max_tokens', purpose: 'The maximum number of tokens that can be generated in the chat completion.', required: false },
    { param: 'temperature', purpose: 'What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.', required: false },
    // { param: 'top_p', purpose: 'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass.', required: false },
    // { param: 'n', purpose: 'How many chat completion choices to generate for each input message.', required: false },
    { param: 'stream', purpose: 'If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only server-sent events as they become available.', required: false },
    {
      param: 'cache_threshold',
      purpose: 'Set the similarity threshold (between 0.1 and 0.99) above which cached entries are returned instead of calling the LLM.',
      required: false
    },

    {
      param: 'is_cached',
      purpose: 'Return a cached answer if available and store your question for future caching.',
      required: false
    }
    // { param: 'stop', purpose: 'Up to 4 sequences where the API will stop generating further tokens.', required: false },
    // { param: 'presence_penalty', purpose: 'Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far.', required: false },
    // { param: 'frequency_penalty', purpose: 'Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far.', required: false },
    // { param: 's', purpose: 'Modify the likelihood of specified tokens appearing in the completion.', required: false },
    // { param: 'user', purpose: 'A unique identifier representing your end-user, which can help OpenRouter to monitor and detect abuse.', required: false },
    // { param: 'response_format', purpose: 'An object specifying the format that the model must output. Compatible with GPT-4 Turbo and all GPT-3.5 Turbo models newer than gpt-3.5-turbo-1106.', required: false },
    // { param: 'seed', purpose: 'This feature is in Beta. If specified, our system will make a best effort to sample deterministically.', required: false },
    // { param: 'tools', purpose: 'A list of tools the model may call. Currently, only functions are supported as a tool.', required: false },
    // { param: 'tool_choice', purpose: 'Controls which (if any) function is called by the model.', required: false }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'model-selection', label: 'Model Selection', icon: Sparkles },
    { id: 'completions', label: 'Completions', icon: Code },
    { id: 'chat', label: 'Chat Completions', icon: Sparkles },
    { id: 'streaming', label: 'Streaming', icon: Zap },
    { id: 'caching', label: 'Response Caching', icon: Database },
    { id: 'errors', label: 'Error Responses', icon: ExternalLink }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {isMobile ? <></> : <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">⚡</span>
              </div>}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">Nexus AI Hub</h1>
                <p className="text-slate-400 text-xs sm:text-sm truncate">API Reference</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover open={isLlmDetailsOpen} onOpenChange={setIsLlmDetailsOpen}>
                <PopoverTrigger asChild>
                  {!isMobile ? <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 text-xs sm:text-sm px-2 sm:px-3"
                    data-testid="button-llm-details"
                  >
                    <Layers className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">LLM Details</span>
                  </Button> : <></>}
                </PopoverTrigger>
                <PopoverContent className="w-[95vw] sm:w-[1200px] h-[80vh] sm:h-[700px] bg-slate-900 border-slate-700" align="end">
                  <div className="space-y-4 h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-100">Available Models & Providers</h3>
                      <div className="text-xs sm:text-sm text-slate-400">
                        {sortedModels.length} models from {Object.keys(modelsByProvider).length} providers
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <Input
                          placeholder="Search models..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-600 text-slate-100"
                          data-testid="input-search-models"
                          style={{ height: "39px" }}
                        />
                      </div>

                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                          <SelectValue placeholder="All Providers" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="all">All Providers</SelectItem>
                          {availableProviders.map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              {getProviderDisplayName(provider)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={costSort} onValueChange={setCostSort}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Sort by Cost" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="none">No Sorting</SelectItem>
                          <SelectItem value="low-to-high">Cost: Low to High</SelectItem>
                          <SelectItem value="high-to-low">Cost: High to Low</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* <Button
                        variant={showPopular ? "default" : "outline"}
                        onClick={() => setShowPopular(!showPopular)}
                        className="border-slate-600"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Popular
                      </Button> */}
                    </div>

                    {loadingModels ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <ScrollArea className="h-[580px]">
                        <Accordion type="multiple" className="space-y-2">
                          {Object.entries(modelsByProvider).map(([providerSlug, models]) => {
                            const provider = getProviderInfo(models[0].id);
                            return (
                              <AccordionItem
                                key={providerSlug}
                                value={providerSlug}
                                className="bg-slate-800/30 border border-slate-700 rounded-lg"
                              >
                                <AccordionTrigger className="px-4 py-3 hover:bg-slate-800/50">
                                  <div className="flex items-center justify-between w-full mr-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                      <span className="font-medium text-slate-100">
                                        {getProviderDisplayName(providerSlug)}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {models.length} models
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {provider?.privacy_policy_url && (
                                        <a
                                          href={provider.privacy_policy_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-400 hover:text-indigo-300"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                  <div className="space-y-3">
                                    {provider && (
                                      <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h4 className="font-medium text-slate-100 mb-1">{provider.name}</h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                              {provider.privacy_policy_url && (
                                                <a href={provider.privacy_policy_url} target="_blank" rel="noopener noreferrer"
                                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                  Privacy Policy <ExternalLink className="w-3 h-3" />
                                                </a>
                                              )}
                                              {provider.terms_of_service_url && (
                                                <a href={provider.terms_of_service_url} target="_blank" rel="noopener noreferrer"
                                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                  Terms of Service <ExternalLink className="w-3 h-3" />
                                                </a>
                                              )}
                                              {provider.status_page_url && (
                                                <a href={provider.status_page_url} target="_blank" rel="noopener noreferrer"
                                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                  Status Page <ExternalLink className="w-3 h-3" />
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {models.map((model) => (
                                      <Card key={model.id} className="bg-slate-800/50 border-slate-700">
                                        <CardContent className="p-4">
                                          <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                              <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                  <h4 className="font-medium text-slate-100">{model.name}</h4>
                                                  <Badge variant="secondary" className="text-xs">
                                                    {model?.architecture?.modality}
                                                  </Badge>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono">{model.id}</p>
                                                <p className="text-sm text-slate-300 line-clamp-2">{model.description}</p>
                                              </div>
                                              <div className="text-right space-y-1 ml-4">
                                                <div className="text-xs text-slate-400">Context Length</div>
                                                <div className="text-sm font-medium text-slate-200">
                                                  {model.context_length?.toLocaleString()} tokens
                                                </div>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-xs">
                                              <div className="space-y-2">
                                                <div className="text-slate-400">Pricing (per 1M tokens)</div>
                                                <div className="space-y-1">
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-300">Input:</span>
                                                    <span className="font-medium text-green-400">${model.pricing?.prompt}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-300">Output:</span>
                                                    <span className="font-medium text-green-400">${model.pricing?.completion}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="space-y-2">
                                                <div className="text-slate-400">Technical Details</div>
                                                <div className="space-y-1">
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-300">Tokenizer:</span>
                                                    <span className="text-slate-200">{model?.architecture?.tokenizer}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-300">Moderated:</span>
                                                    <span className="text-slate-200">
                                                      {model.top_provider?.is_moderated ? 'Yes' : 'No'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="space-y-2">
                                                <div className="text-slate-400">Capabilities</div>
                                                <div className="space-y-1">
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-300">Max Completion:</span>
                                                    <span className="text-slate-200">
                                                      {model.top_provider?.max_completion_tokens?.toLocaleString() || 'N/A'}
                                                    </span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-300">Instruct Type:</span>
                                                    <span className="text-slate-200">
                                                      {model?.architecture?.instruct_type || 'N/A'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </ScrollArea>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 text-xs sm:text-sm px-2 sm:px-3"
                data-testid="button-dashboard"
                onClick={() => window.open('https://nexusaihub.co.in/nexus/api-integrations', '_blank')}
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-xs sm:text-sm px-2 sm:px-3"
                data-testid="button-get-api-key"
                onClick={handleTryIt}

              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Try It Live</span>
                <span className="sm:hidden">Try</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/30 lg:min-h-screen lg:sticky lg:top-16 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveEndpoint(item.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors text-sm sm:text-base ${activeEndpoint === item.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-sm sm:text-base">{item.label}</span>
                  {activeEndpoint === item.id && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto" />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Documentation Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {activeEndpoint === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">API Reference</h1>
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                    An overview of Nexus AI Hub's API. Nexus AI Hub's request and response schemas are very similar to the OpenAI Chat API, with a few small differences. At a high level, Nexus AI Hub normalizes the schema across models and providers so you only need to learn one.
                  </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300">
                      Get started with Nexus AI Hub API in three simple steps:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium">Get your API key</p>
                          <p className="text-slate-400 text-sm">Sign up and generate your API key from the dashboard</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium">Choose your model</p>
                          <p className="text-slate-400 text-sm">Select from 300+ AI models including GPT-4, Claude, and more</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium">Make your first request</p>
                          <p className="text-slate-400 text-sm">Send a POST request to our endpoints and get AI responses</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeEndpoint === 'authentication' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Authentication</h1>
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                    Nexus AI Hub API uses Bearer token authentication. Include your API key in the Authorization header.
                  </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Authorization Header</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                      <code className="text-green-400">Authorization: Bearer YOUR_API_KEY</code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeEndpoint === 'model-selection' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4">Model Selection</h1>
                  <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Nexus AI Hub provides intelligent model routing that automatically selects the best-performing model for your request. You can use automatic selection or specify a model directly.
                  </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                      Automatic Model Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <p className="text-slate-300 text-sm sm:text-base">
                      Use these special model identifiers to let Nexus AI Hub automatically select the best model:
                    </p>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-700">
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="flex-1 w-full min-w-0">
                            <code className="text-indigo-400 bg-slate-900 px-2 py-1 rounded font-mono text-xs sm:text-sm break-all">
                              nexus/auto
                            </code>
                            <p className="text-slate-300 mt-2 text-sm sm:text-base">
                              Model is decided automatically based on the best available model for your request.
                            </p>
                            <div className="bg-slate-900 rounded-lg p-2 sm:p-3 mt-3 font-mono text-[10px] sm:text-xs overflow-x-auto">
                              <pre className="text-slate-300">
                                {`{
  "model": "nexus/auto",
  "messages": [...]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-700">
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1 w-full min-w-0">
                            <code className="text-purple-400 bg-slate-900 px-2 py-1 rounded font-mono text-xs sm:text-sm break-all">
                              nexus/auto:teacher
                            </code>
                            <p className="text-slate-300 mt-2 text-sm sm:text-base">
                              Only teacher-related models will be used automatically. Perfect for educational content and tutoring applications.
                            </p>
                            <div className="bg-slate-900 rounded-lg p-2 sm:p-3 mt-3 font-mono text-[10px] sm:text-xs overflow-x-auto">
                              <pre className="text-slate-300">
                                {`{
  "model": "nexus/auto:teacher",
  "messages": [...]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-700">
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="flex-1 w-full min-w-0">
                            <code className="text-green-400 bg-slate-900 px-2 py-1 rounded font-mono text-xs sm:text-sm break-all">
                              nexus/auto:intent
                            </code>
                            <p className="text-slate-300 mt-2 text-sm sm:text-base">
                              Model is selected automatically based on the intent detected in the user prompt. Analyzes your query to choose the most suitable model.
                            </p>
                            <div className="bg-slate-900 rounded-lg p-2 sm:p-3 mt-3 font-mono text-[10px] sm:text-xs overflow-x-auto">
                              <pre className="text-slate-300">
                                {`{
  "model": "nexus/auto:intent",
  "messages": [...]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Code className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                      Specific Model Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <p className="text-slate-300 text-sm sm:text-base">
                      You can also specify a particular model directly by using its full identifier:
                    </p>
                    <div className="bg-slate-900 rounded-lg p-3 sm:p-4 font-mono text-[10px] sm:text-xs overflow-x-auto">
                      <pre className="text-slate-300">
                        {`{
  "model": "openai/gpt-4o-mini",
  "messages": [...]
}

// Other examples:
// "model": "anthropic/claude-3.5-sonnet"
// "model": "meta-llama/llama-3.3-70b-instruct"
// "model": "google/gemini-2.0-flash-exp"`}
                      </pre>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Browse available models using the "LLM Details" button in the header to see all supported models and their specifications.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-indigo-500/10 border-indigo-500/30 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-300 text-base sm:text-lg">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 sm:space-y-3 text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">Use <code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs sm:text-sm break-all">nexus/auto</code> for general-purpose applications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">Use <code className="text-purple-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs sm:text-sm break-all">nexus/auto:teacher</code> for educational content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">Use <code className="text-green-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs sm:text-sm break-all">nexus/auto:intent</code> when you want the system to analyze prompt intent</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">Specify exact models when you need consistent behavior or specific model capabilities</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeEndpoint === 'completions' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Completions</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 sm:mb-4">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">POST</Badge>
                    <code className="text-slate-300 bg-slate-800 px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm break-all">
                      https://nexusai.hub/api/v1/create
                    </code>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Send a completion request to a selected model. The request uses a "prompt" parameter for text completions.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Parameters</h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <table className="w-full border-collapse border border-slate-700 text-sm">
                          <thead>
                            <tr className="bg-slate-800/50">
                              <th className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Parameter</th>
                              <th className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Purpose</th>
                              <th className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Required</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completionsParams.map((param, index) => (
                              <tr key={index} className="hover:bg-slate-800/30">
                                <td className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3">
                                  <code className="text-indigo-400 bg-slate-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono text-xs sm:text-sm break-all">
                                    {param.param}
                                  </code>
                                </td>
                                <td className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3 text-slate-300 text-xs sm:text-sm">{param.purpose}</td>
                                <td className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3">
                                  {param.required ? (
                                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Required</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30">Optional</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeEndpoint === 'chat' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Chat Completions</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 sm:mb-4">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">POST</Badge>
                    <code className="text-slate-300 bg-slate-800 px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm break-all">
                      https://nexusai.hub/api/v1/chat/create
                    </code>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Send a chat completion request to a selected model. The request uses a "messages" array for conversational AI.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Parameters</h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <table className="w-full border-collapse border border-slate-700 text-sm">
                          <thead>
                            <tr className="bg-slate-800/50">
                              <th className="border border-slate-700 px-4 py-3 text-left font-medium">Parameter</th>
                              <th className="border border-slate-700 px-4 py-3 text-left font-medium">What It Does</th>
                              <th className="border border-slate-700 px-4 py-3 text-left font-medium">Required</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chatParams.map((param, index) => (
                              <tr key={index} className="hover:bg-slate-800/30">
                                <td className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3">
                                  <code className="text-indigo-400 bg-slate-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono text-xs sm:text-sm break-all">
                                    {param.param}
                                  </code>
                                </td>
                                <td className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3 text-slate-300 text-xs sm:text-sm">{param.purpose}</td>
                                <td className="border border-slate-700 px-3 sm:px-4 py-2 sm:py-3">
                                  {param.required ? (
                                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Required</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30">Optional</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeEndpoint === 'streaming' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Streaming</h1>
                  <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
                    Enable real-time streaming responses by setting the "stream" parameter to true. Perfect for chat interfaces and live applications.
                  </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Streaming Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                      <code className="text-slate-300">
                        <span className="text-blue-400">"stream"</span>: <span className="text-green-400">true</span>
                      </code>
                    </div>
                    <p className="text-slate-400 text-sm mt-3">
                      When streaming is enabled, you'll receive partial responses as they're generated, allowing for real-time user experiences.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeEndpoint === 'caching' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Response Caching</h1>
                  <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
                    Nexus AI Hub provides two types of response caching to optimize performance and reduce costs: Exact Caching and Semantic Caching.
                  </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Exact Caching</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300">
                      Exact caching matches requests precisely, requiring the exact same parameters and prompt to return a cached response.
                    </p>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                      <pre className="text-slate-300 whitespace-pre-wrap">
                        {`// Example: Exact Match Required
{
  "model": "openai/gpt-4",
  "messages": [
    {"role": "user", "content": "What is AI?"}
  ],
  "temperature": 0.7
}`}
                      </pre>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Only requests with identical parameters and content will hit the cache.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Semantic Caching</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300">
                      Semantic caching uses AI to match similar requests, even if they're worded differently, based on a configurable similarity threshold.
                    </p>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                      <pre className="text-slate-300 whitespace-pre-wrap">
                        {`// These questions might hit the same cache:
{
  "messages": [{"role": "user", "content": "What is artificial intelligence?"}]
}

{
  "messages": [{"role": "user", "content": "Can you explain AI?"}]
}`}
                      </pre>
                    </div>
                    <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-4 mt-4">
                      <h4 className="text-indigo-300 font-medium mb-2">Configurable Threshold</h4>
                      <p className="text-slate-300 text-sm">
                        Set semantic_cache_threshold
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>0.0 - Exact matching only</li>
                          <li>0.8 - Conservative semantic matching</li>
                          <li>0.95 - Aggressive semantic matching</li>
                        </ul>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeEndpoint === 'errors' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Error Responses</h1>
                  <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
                    For errors, Nexus AI Hub returns a JSON response with the following shape:
                  </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Error Response Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                      <pre className="text-slate-300 whitespace-pre-wrap">
                        {`type ErrorResponse = {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
};`}
                      </pre>
                    </div>
                    <p className="text-slate-400 text-sm mt-3">
                      The HTTP Response will have the same status code as `error.code`, forming a request error if your original request is invalid or your API key/account is out of credits.
                    </p>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Error Codes</h3>
                  <div className="space-y-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-red-400">400 - Bad Request</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">Invalid or missing params, CORS issues</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-red-400">401 - Invalid Credentials</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">OAuth session expired, disabled/invalid API key</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-orange-400">402 - Insufficient Credits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">Your account or API key has insufficient credits. Add more credits and retry the request.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-orange-400">403 - Content Moderation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">Your chosen model requires moderation and your input was flagged</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-yellow-400">408 - Request Timeout</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">Your request timed out</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-yellow-400">429 - Rate Limited</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">You are being rate limited</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-red-400">502 - Model Unavailable</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">Your chosen model is down or we received an invalid response from it</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-red-400">503 - No Available Provider</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">There is no available model provider that meets your routing requirements</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">JavaScript Error Handling Example</h3>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                        <pre className="text-slate-300 whitespace-pre-wrap">
                          {`const request = await fetch('https://nexusai.hub/api/v1/chat/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});

console.log(request.status); // Will be an error code unless the model started processing
const response = await request.json();
console.error(response.error?.code); // Will be an error code
console.error(response.error?.message);`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Streaming Error Formats</h3>
                  <p className="text-slate-300 mb-4">
                    When using streaming mode (`stream: true`), errors are handled differently depending on when they occur:
                  </p>

                  <div className="space-y-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle>Pre-Stream Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">
                          Errors that occur before any tokens are sent follow the standard error format above, with appropriate HTTP status codes.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle>Mid-Stream Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300 mb-3">
                          Errors that occur after streaming has begun are sent as Server-Sent Events (SSE):
                        </p>
                        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs">
                          <pre className="text-slate-300 whitespace-pre-wrap">
                            {`type MidStreamError = {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  provider: string;
  error: {
    code: string | number;
    message: string;
  };
  choices: [{
    index: 0;
    delta: { content: '' };
    finish_reason: 'error';
  }];
};`}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Moderation Errors</h3>
                  <p className="text-slate-300 mb-4">
                    If your input was flagged, the `error.metadata` will contain information about the issue:
                  </p>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                        <pre className="text-slate-300 whitespace-pre-wrap">
                          {`type ModerationErrorMetadata = {
  reasons: string[]; // Why your input was flagged
  flagged_input: string; // The flagged text segment (limited to 100 characters)
  provider_name: string; // The provider that requested moderation
  model_slug: string;
};`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">When No Content is Generated</h3>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent>
                      <p className="text-slate-300 mb-3">
                        Occasionally, the model may not generate any content. This typically occurs when:
                      </p>
                      <ul className="text-slate-300 list-disc list-inside space-y-2">
                        <li>The model is warming up from a cold start</li>
                        <li>The system is scaling up to handle more requests</li>
                      </ul>
                      <p className="text-slate-300 mt-3">
                        Warm-up times usually range from a few seconds to a few minutes, depending on the model and provider.
                        Consider implementing a simple retry mechanism or trying a different model with more recent activity.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Simple Code Examples */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/30 p-4 sm:p-6 lg:sticky lg:top-16 h-auto lg:h-screen overflow-y-auto">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Example Request</h3>
                <div className="bg-slate-900 rounded-lg p-3 sm:p-4 font-mono text-[10px] sm:text-xs overflow-x-auto">
                  <pre className="text-slate-300 whitespace-pre-wrap">
                    {activeEndpoint === 'chat' ?
                      `{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "What is the meaning of life?"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": false,
  "cache_threshold": 0.50,
  "is_cached": false
}` :
                      `{
  "model": "openai/gpt-3.5-turbo-instruct",
  "prompt": "Write a story about AI:",
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": false,
  "cache_threshold": 0.50,
  "is_cached": false
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Example Response</h3>
                <div className="bg-slate-900 rounded-lg p-3 sm:p-4 font-mono text-[10px] sm:text-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">200</Badge>
                    <span className="text-slate-400">Successful</span>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap">
                    {activeEndpoint === 'chat' ?
                      `{
    "id": "gen-1759174197-G4wgnNBDR07wdzd4gOY2",
    "provider": "OpenAI",
    "model": "openai/gpt-4o-mini",
    "object": "chat.completion.chunk",
    "created": 1759174198,
    "choices": [
        {
            "index": 0,
            "delta": {
                "role": "assistant",
                "content": ""
            },
            "finish_reason": null,
            "native_finish_reason": null,
            "logprobs": null
        }
    ],
    "usage": {
        "prompt_tokens": 1108,
        "completion_tokens": 398,
        "total_tokens": 1506,
        "prompt_tokens_details": {
            "cached_tokens": 0,
            "audio_tokens": 0
        },
        "completion_tokens_details": {
            "reasoning_tokens": 0
        }
    }
}` :
                      `{
  "id": "cmpl-abc123",
  "object": "text_completion",
  "choices": [
    {
      "text": "\\n\\nIn the future, AI will...",
      "finish_reason": "length"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 150,
    "total_tokens": 162
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}