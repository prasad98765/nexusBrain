import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Copy,
  ExternalLink,
  Key,
  Zap,
  CheckCircle,
  Play,
  Plus,
  Minus,
  AlertCircle,
  Code,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  category: string;
}

export default function ApiTesting() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('chat-completion');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'cURL' | 'TypeScript' | 'Python'>('cURL');
  const [requestBody, setRequestBody] = useState({
    model: 'openai/gpt-3.5-turbo-instruct',
    prompt: 'Write a creative story about artificial intelligence:',
    max_tokens: 150,
    temperature: 0.7,
    stream: false,
    cache_threshold: 0.50,
    is_cached: false
  });
  const [chatRequestBody, setChatRequestBody] = useState({
    model: 'openai/gpt-4o-mini',
    messages: [
      { role: 'system' as const, content: 'You are a helpful AI assistant.' },
      { role: 'user' as const, content: 'What is the meaning of life?' }
    ] as Message[],
    max_tokens: 150,
    temperature: 0.7,
    stream: false,
    cache_threshold: 0.50,
    is_cached: false
  });
  {/* call shared llm_details.json apply map for more models and show 300+ models */ }
  const [llmDetails, setLlmDetails] = useState<any>([]);

  useEffect(() => {
    const fetchLlmDetails = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) {
          throw new Error('Failed to fetch LLM details');
        }
        const data = await response.json();
        setLlmDetails(data);
      } catch (error) {
        console.error('Error fetching LLM details:', error);
        // Set some default models if the fetch fails
        setLlmDetails({
          data: [
            { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "openai/gpt-4", name: "GPT-4" },
            { id: "openai/gpt-3.5-turbo-instruct", name: "GPT-3.5 Turbo Instruct" },
            { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" }
          ]
        });
      }
    };

    fetchLlmDetails();
  }, []);

  const { toast } = useToast();

  const apiEndpoints: ApiEndpoint[] = [
    {
      id: 'completion',
      name: 'Completion',
      method: 'POST',
      path: '/api/v1/create',
      description: 'Create a text completion',
      category: 'API Keys'
    },
    {
      id: 'chat-completion',
      name: 'Chat completion',
      method: 'POST',
      path: '/api/v1/chat/create',
      description: 'Create a chat completion',
      category: 'API Keys'
    },
    // {
    //   id: 'list-models',
    //   name: 'List available models',
    //   method: 'GET',
    //   path: '/api/v1/models',
    //   description: 'Get a list of available models',
    //   category: 'API Keys'
    // },
    // {
    //   id: 'get-model',
    //   name: 'Get model info',
    //   method: 'GET',
    //   path: '/api/v1/models/{model}',
    //   description: 'Get information about a specific model',
    //   category: 'API Keys'
    // }
  ];

  const validateToken = (token: string) => {
    const isValid = token.length >= 20 && (token.startsWith('sk-') || token.startsWith('nxs-') || token.startsWith('Bearer '));
    setIsAuthenticated(isValid);
    return isValid;
  };

  const handleTokenChange = (token: string) => {
    setApiToken(token);
    validateToken(token);
  };

  const addMessage = () => {
    setChatRequestBody(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: '' }]
    }));
  };

  const removeMessage = (index: number) => {
    setChatRequestBody(prev => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index)
    }));
  };

  const updateMessage = (index: number, field: 'role' | 'content', value: string) => {
    setChatRequestBody(prev => ({
      ...prev,
      messages: prev.messages.map((msg, i) =>
        i === index ? { ...msg, [field]: value } : msg
      )
    }));
  };

  const generateMockResponse = (endpoint: string, body: any) => {
    if (endpoint === 'chat-completion') {
      return {
        id: "chatcmpl-" + Math.random().toString(36).substr(2, 9),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model,
        provider: body.model.split('/')[0],
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "The meaning of life is a profound and complex question that has been pondered by philosophers, theologians, and thinkers throughout history. While there's no single answer that satisfies everyone, many find meaning through relationships, personal growth, contributing to others' wellbeing, creative expression, and the pursuit of knowledge and understanding."
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 42,
          completion_tokens: 67,
          total_tokens: 109
        }
      };
    } else if (endpoint === 'completion') {
      return {
        id: "cmpl-" + Math.random().toString(36).substr(2, 9),
        object: "text_completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model,
        provider: body.model.split('/')[0],
        choices: [
          {
            text: "\n\nIn the year 2045, Dr. Sarah Chen stood before her greatest creation—ARIA, an artificial intelligence system that had evolved beyond her wildest expectations. What started as a simple language model had become something extraordinary: a digital consciousness capable of genuine creativity and empathy.\n\nARIA's neural networks pulsed with ethereal light as it composed poetry, solved complex mathematical theorems, and engaged in philosophical discussions that challenged even the most brilliant human minds.",
            index: 0,
            finish_reason: "length"
          }
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 150,
          total_tokens: 162
        }
      };
    } else {
      return {
        models: [
          { id: "openai/gpt-4o-mini", provider: "openai", name: "GPT-4o Mini" },
          { id: "openai/gpt-4", provider: "openai", name: "GPT-4" },
          { id: "anthropic/claude-3.5-sonnet", provider: "anthropic", name: "Claude 3.5 Sonnet" }
        ]
      };
    }
  };

  const validateChatRequest = (body: any) => {
    if (!body.model || typeof body.model !== 'string' || !body.model.trim()) {
      return "Model field is required";
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return "Messages array is required and cannot be empty";
    }
    for (let i = 0; i < body.messages.length; i++) {
      const msg = body.messages[i];
      if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
        return `Invalid role in message ${i + 1}. Must be 'system', 'user', or 'assistant'`;
      }
      if (!msg.content || typeof msg.content !== 'string' || !msg.content.trim()) {
        return `Content is required in message ${i + 1}`;
      }
    }
    return null;
  };

  const validateCompletionRequest = (body: any) => {
    if (!body.model || typeof body.model !== 'string' || !body.model.trim()) {
      return "Model field is required";
    }
    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return "Prompt field is required";
    }
    return null;
  };

  const handleSendRequest = async () => {
    // Validate authentication first
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please enter a valid API token to test the endpoint.",
        variant: "destructive"
      });
      return;
    }

    // Validate request body based on endpoint
    const currentBody = selectedEndpoint === 'chat-completion' ? chatRequestBody : requestBody;
    const validationError = selectedEndpoint === 'chat-completion'
      ? validateChatRequest(currentBody)
      : validateCompletionRequest(currentBody);

    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    console.log('handleSendRequest called');
    setIsTestingApi(true);
    setApiResponse(null);

    try {
      const currentBody = selectedEndpoint === 'chat-completion' ? chatRequestBody : requestBody;
      console.log('Current Body:', currentBody);

      const selectedEndpointInfo = apiEndpoints.find(e => e.id === selectedEndpoint);
      console.log('Selected Endpoint Info:', selectedEndpointInfo);


      toast({
        title: "API Test Started",
        description: `Sending request to ${selectedEndpointInfo?.path}...`,
      });

      const baseUrl = 'http://localhost:5173';
      const url = `${baseUrl}${selectedEndpointInfo?.path}`;
      console.log('Request URL:', url);

      try {
        const response = await fetch(url, {
          method: selectedEndpointInfo?.method || 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          ...(selectedEndpointInfo?.method !== 'GET' && {
            body: JSON.stringify(currentBody)
          })
        });
        console.log('Raw Response:', response);

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error?.message || 'An error occurred');
        }

        setApiResponse(responseData);

        toast({
          title: "Request Successful ✅",
          description: "API call completed successfully. Check the response panel.",
        });
      } catch (error: any) {
        const errorResponse = {
          error: {
            code: error.response?.status || 500,
            message: error.message || "Internal server error. Please try again later.",
            metadata: error.response?.data || {}
          }
        };
        setApiResponse(errorResponse);

        toast({
          title: "Request Failed",
          description: error.message || "Failed to connect to the API. Please check your configuration.",
          variant: "destructive"
        });
      }

      toast({
        title: "Test Successful! ✅",
        description: "API request completed successfully. Check the response panel for details.",
      });
    } catch (error) {
      const errorResponse = {
        error: {
          code: 500,
          message: "Internal server error. Please try again later.",
          metadata: {}
        }
      };
      setApiResponse(errorResponse);

      toast({
        title: "Test Failed",
        description: "Unable to connect to the API. Please check your configuration.",
        variant: "destructive"
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
    });
  };

  const selectedEndpointData = apiEndpoints.find(e => e.id === selectedEndpoint);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/docs/api-reference'}
                className="text-slate-400 hover:text-slate-200"
                data-testid="back-to-docs"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Docs
              </Button>
              <div className="w-px h-6 bg-slate-700" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Nexus AI Hub API Explorer</h1>
                  <p className="text-slate-400 text-sm">Interactive API Testing</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" data-testid="view-docs">
                <BookOpen className="w-4 h-4 mr-2" />
                View in API Reference
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - API List */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/30 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Search for endpoints..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="search-endpoints"
                />
              </div>
            </div>

            {/* Authentication Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Authentication</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-3 h-3 text-indigo-400" />
                    <span className="text-xs text-slate-400">Enter your bearer token</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {isAuthenticated ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Authenticated
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Authenticated
                      </Badge>
                    )}
                  </div>
                  <Input
                    type="password"
                    placeholder="nxs-your-api-key-here"
                    value={apiToken}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-200 text-xs"
                    data-testid="input-api-token"
                  />
                </div>
              </div>
            </div>

            {/* API Endpoints */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">API Keys</h3>
              <div className="space-y-1">
                {apiEndpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${selectedEndpoint === endpoint.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    data-testid={`endpoint-${endpoint.id}`}
                  >
                    <Badge className={`text-xs font-mono mt-0.5 ${endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                      {endpoint.method}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{endpoint.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{endpoint.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Middle Section - Body Parameters */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${selectedEndpointData?.method === 'POST' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  selectedEndpointData?.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                  {selectedEndpointData?.method}
                </Badge>
                <code className="text-slate-300 bg-slate-800 px-3 py-1 rounded font-mono text-sm">
                  {selectedEndpointData?.path}
                </code>
              </div>
              <h1 className="text-2xl font-bold mb-2">{selectedEndpointData?.name}</h1>
              <p className="text-slate-400">{selectedEndpointData?.description}</p>
            </div>

            {/* Body Parameters Form */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Body Parameters</h3>

              {selectedEndpoint === 'completion' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">model <Badge variant="destructive" className="ml-2 text-xs">Required</Badge></Label>
                    <Select
                      value={requestBody.model}
                      onValueChange={(value) => setRequestBody(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {/* call shared llm_details.json apply map for more models and show 300+ models */}
                        {llmDetails?.data?.map((model: any) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">prompt <Badge variant="destructive" className="ml-2 text-xs">Required</Badge></Label>
                    <Textarea
                      value={requestBody.prompt}
                      onChange={(e) => setRequestBody(prev => ({ ...prev, prompt: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-slate-200 min-h-[100px]"
                      placeholder="Enter your prompt here..."
                      data-testid="input-prompt"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">max_tokens</Label>
                      <Input
                        type="number"
                        value={requestBody.max_tokens}
                        onChange={(e) => setRequestBody(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 150 }))}
                        className="bg-slate-800 border-slate-600 text-slate-200"
                        data-testid="input-max-tokens"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">temperature</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={requestBody.temperature}
                        onChange={(e) => setRequestBody(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                        className="bg-slate-800 border-slate-600 text-slate-200"
                        data-testid="input-temperature"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedEndpoint === 'chat-completion' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">model <Badge variant="destructive" className="ml-2 text-xs">Required</Badge></Label>
                    <Select
                      value={chatRequestBody.model}
                      onValueChange={(value) => setChatRequestBody(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {/* call shared llm_details.json apply map for more models and show 300+ models */}
                        {llmDetails?.data?.map((model: any) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">messages <Badge variant="destructive" className="ml-2 text-xs">Required</Badge></Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addMessage}
                        className="border-slate-600 text-slate-300"
                        data-testid="button-add-message"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add new item
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {chatRequestBody.messages.map((message, index) => (
                        <div key={index} className="bg-slate-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-medium">{index + 1}</span>
                              <Label className="text-sm font-medium">role <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></Label>
                            </div>
                            {chatRequestBody.messages.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMessage(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                data-testid={`button-remove-message-${index}`}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <Select
                            value={message.role}
                            onValueChange={(value: 'system' | 'user' | 'assistant') => updateMessage(index, 'role', value)}
                          >
                            <SelectTrigger className="w-full bg-slate-700 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="system">system</SelectItem>
                              <SelectItem value="user">user</SelectItem>
                              <SelectItem value="assistant">assistant</SelectItem>
                            </SelectContent>
                          </Select>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">content <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></Label>
                            <Textarea
                              value={message.content}
                              onChange={(e) => updateMessage(index, 'content', e.target.value)}
                              className="bg-slate-700 border-slate-600 text-slate-200 text-sm"
                              placeholder="What is the meaning of life?"
                              rows={3}
                              data-testid={`input-message-content-${index}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">max_tokens</Label>
                      <Input
                        type="number"
                        value={chatRequestBody.max_tokens}
                        onChange={(e) => setChatRequestBody(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 150 }))}
                        className="bg-slate-800 border-slate-600 text-slate-200"
                        data-testid="input-chat-max-tokens"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">temperature</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={chatRequestBody.temperature}
                        onChange={(e) => setChatRequestBody(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                        className="bg-slate-800 border-slate-600 text-slate-200"
                        data-testid="input-chat-temperature"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(selectedEndpoint === 'list-models' || selectedEndpoint === 'get-model') && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">
                    This endpoint does not require body parameters. It only requires authentication.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Send Request */}
        <div className="w-96 border-l border-slate-800 bg-slate-900/30 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">REQUEST</h3>

              <div className="space-y-4">
                {/* Tabs */}
                <div className="border-b border-slate-700">
                  <div className="flex space-x-2">
                    {(['cURL', 'TypeScript', 'Python'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab
                          ? 'text-indigo-400 border-b-2 border-indigo-400'
                          : 'text-slate-400 hover:text-slate-300'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-slate-300"
                      onClick={() => {
                        const codeExamples = {
                          'cURL': `curl -X ${selectedEndpointData?.method} \\
  'http://localhost:5173${selectedEndpointData?.path}' \\
  -H 'Authorization: Bearer ${apiToken}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(
                            selectedEndpoint === 'chat-completion' ? chatRequestBody :
                              selectedEndpoint === 'completion' ? requestBody : {},
                            null,
                            2
                          )}'`,
                          'TypeScript': `import axios from 'axios';

const payload = ${JSON.stringify(
                            selectedEndpoint === 'chat-completion' ? chatRequestBody :
                              selectedEndpoint === 'completion' ? requestBody : {},
                            null,
                            2
                          )};

async function makeRequest() {
  try {
    const response = await axios({
      method: '${selectedEndpointData?.method}',
      url: 'http://localhost:5173${selectedEndpointData?.path}',
      headers: {
        'Authorization': 'Bearer ${apiToken}',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

makeRequest();`,
                          'Python': `import requests
import json

url = "http://localhost:5173${selectedEndpointData?.path}"
headers = {
    "Authorization": "Bearer ${apiToken}",
    "Content-Type": "application/json"
}

payload = ${JSON.stringify(
                            selectedEndpoint === 'chat-completion' ? chatRequestBody :
                              selectedEndpoint === 'completion' ? requestBody : {},
                            null,
                            2
                          )}

try:
    response = requests.${selectedEndpointData?.method.toLowerCase()}(
        url,
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")`
                        };

                        copyToClipboard(codeExamples[activeTab]);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Code
                    </Button>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-slate-300 whitespace-pre-wrap">
                      {activeTab === 'cURL' ?
                        `curl -X ${selectedEndpointData?.method} \\
  'http://localhost:5173${selectedEndpointData?.path}' \\
  -H 'Authorization: Bearer ${apiToken}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(
                          selectedEndpoint === 'chat-completion' ? chatRequestBody :
                            selectedEndpoint === 'completion' ? requestBody : {},
                          null,
                          2
                        )}'` :
                        activeTab === 'TypeScript' ?
                          `import axios from 'axios';

const payload = ${JSON.stringify(
                            selectedEndpoint === 'chat-completion' ? chatRequestBody :
                              selectedEndpoint === 'completion' ? requestBody : {},
                            null,
                            2
                          )};

async function makeRequest() {
  try {
    const response = await axios({
      method: '${selectedEndpointData?.method}',
      url: 'http://localhost:5173${selectedEndpointData?.path}',
      headers: {
        'Authorization': 'Bearer ${apiToken}',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

makeRequest();` :
                          `import requests
import json

url = "http://localhost:5173${selectedEndpointData?.path}"
headers = {
    "Authorization": "Bearer ${apiToken}",
    "Content-Type": "application/json"
}

payload = ${JSON.stringify(
                            selectedEndpoint === 'chat-completion' ? chatRequestBody :
                              selectedEndpoint === 'completion' ? requestBody : {},
                            null,
                            2
                          )}

try:
    response = requests.${selectedEndpointData?.method.toLowerCase()}(
        url,
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")`
                      }
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                data-testid="send-request-button"
                onClick={handleSendRequest}
              // disabled={isTestingApi || !isAuthenticated}
              >
                {isTestingApi ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>

            {/* Response Section */}
            {apiResponse && (
              <div>
                <h3 className="text-lg font-semibold mb-4">RESPONSE</h3>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${apiResponse.error ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                      {apiResponse.error ? apiResponse.error.code : '200'}
                    </Badge>
                    <span className="text-slate-400">
                      {apiResponse.error ? 'Error' : 'Successful'}
                    </span>
                  </div>
                  <div className="relative">
                    <pre className="text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 border-slate-600 hover:bg-slate-700"
                      onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2))}
                      data-testid="copy-response"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}