import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Code,
  BookOpen,
  Key,
  Zap,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Play
} from 'lucide-react';

export default function ApiDocumentation() {
  const [activeEndpoint, setActiveEndpoint] = useState('completions');

  const handleTryIt = () => {
    // Navigate to the API testing route
    window.location.href = '/docs/api-reference/test';
  };



  const completionsParams = [
    { param: 'model', purpose: 'The LLM to use. Example: "openai/gpt-3.5-turbo-instruct". You must pick a model Nexus AI Hub supports.', required: true },
    { param: 'prompt', purpose: 'Your input text (for completions).', required: true },
    { param: 'max_tokens', purpose: 'Max length of the reply. Larger = longer answers.', required: false },
    { param: 'temperature', purpose: 'Controls creativity. 0 = deterministic, 1 = creative.', required: false },
    { param: 'top_p', purpose: 'Probability sampling. Usually keep at 0.9.', required: false },
    { param: 'frequency_penalty', purpose: 'Discourages repeating phrases.', required: false },
    { param: 'presence_penalty', purpose: 'Encourages mentioning new concepts.', required: false },
    { param: 'stop', purpose: 'Tell the model where to stop (e.g., ["\\n\\n"]).', required: false },
    { param: 'stream', purpose: 'If true, you get output token by token (good for chat UIs).', required: false },
    { param: 'user', purpose: 'An identifier for your end user (helps Nexus AI Hub track abuse).', required: false },
    { param: 'metadata', purpose: 'Any custom info you want to send (debugging, analytics).', required: false }
  ];

  const chatParams = [
    { param: 'model', purpose: 'Choose a model that Nexus AI Hub supports (e.g. "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", etc.). If you use a wrong model name, you\'ll get no answer.', required: true },
    { param: 'messages', purpose: 'Array of messages (system, user, assistant). At least one user role is required.', required: true },
    { param: 'max_tokens', purpose: 'Max reply length. Too small → you get cut-off answers.', required: false },
    { param: 'temperature', purpose: 'Randomness. 0 = deterministic, 1 = more creative.', required: false },
    { param: 'top_p', purpose: 'Alternative sampling control. Usually keep at 0.9.', required: false },
    { param: 'stream', purpose: 'If true, response comes token by token (you need a streaming handler). For testing, keep false.', required: false },
    { param: 'stop', purpose: 'Define custom stop sequences. If you set this wrong, you might get empty output. Better leave it null.', required: false },
    { param: 'logit_bias', purpose: 'Advanced. Pushes the model toward or away from certain tokens. Usually leave {}.', required: false },
    { param: 'user', purpose: 'An identifier for your end user (helps with tracking).', required: false },
    { param: 'metadata', purpose: 'Custom key-value data for your app\'s analytics.', required: false }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'completions', label: 'Completions', icon: Code },
    { id: 'chat', label: 'Chat Completions', icon: Sparkles },
    { id: 'streaming', label: 'Streaming', icon: Zap },
    { id: 'errors', label: 'Error Responses', icon: ExternalLink }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Nexus AI Hub</h1>
                <p className="text-slate-400 text-sm">API Reference</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300"
                data-testid="button-dashboard"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
                data-testid="button-get-api-key"
              >
                Get API Key
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/30 min-h-screen sticky top-16">
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveEndpoint(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeEndpoint === item.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {activeEndpoint === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex">
          {/* Documentation Content */}
          <div className="flex-1 p-8">
            {activeEndpoint === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">API Reference</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
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
                          <p className="text-slate-400 text-sm">Select from 50+ AI models including GPT-4, Claude, and more</p>
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
                  <h1 className="text-3xl font-bold mb-4">Authentication</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
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

            {activeEndpoint === 'completions' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Completions</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">POST</Badge>
                    <code className="text-slate-300 bg-slate-800 px-3 py-1 rounded font-mono text-sm">
                      https://nexusai.hub/api/v1/create
                    </code>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Send a completion request to a selected model. The request uses a "prompt" parameter for text completions.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Parameters</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-700">
                        <thead>
                          <tr className="bg-slate-800/50">
                            <th className="border border-slate-700 px-4 py-3 text-left font-medium">Parameter</th>
                            <th className="border border-slate-700 px-4 py-3 text-left font-medium">Purpose</th>
                            <th className="border border-slate-700 px-4 py-3 text-left font-medium">Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completionsParams.map((param, index) => (
                            <tr key={index} className="hover:bg-slate-800/30">
                              <td className="border border-slate-700 px-4 py-3">
                                <code className="text-indigo-400 bg-slate-900 px-2 py-1 rounded font-mono text-sm">
                                  {param.param}
                                </code>
                              </td>
                              <td className="border border-slate-700 px-4 py-3 text-slate-300">{param.purpose}</td>
                              <td className="border border-slate-700 px-4 py-3">
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
            )}

            {activeEndpoint === 'chat' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Chat Completions</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">POST</Badge>
                    <code className="text-slate-300 bg-slate-800 px-3 py-1 rounded font-mono text-sm">
                      https://nexusai.hub/api/v1/chat/create
                    </code>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Send a chat completion request to a selected model. The request uses a "messages" array for conversational AI.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Parameters</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-700">
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
                              <td className="border border-slate-700 px-4 py-3">
                                <code className="text-indigo-400 bg-slate-900 px-2 py-1 rounded font-mono text-sm">
                                  {param.param}
                                </code>
                              </td>
                              <td className="border border-slate-700 px-4 py-3 text-slate-300">{param.purpose}</td>
                              <td className="border border-slate-700 px-4 py-3">
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
            )}

            {activeEndpoint === 'streaming' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Streaming</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
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

            {activeEndpoint === 'errors' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Error Responses</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
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
          <div className="w-96 border-l border-slate-800 bg-slate-900/30 p-6 sticky top-16 h-screen overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Example Request</h3>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
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
  "temperature": 0.7
}` :
                      `{
  "model": "openai/gpt-3.5-turbo-instruct",
  "prompt": "Write a story about AI:",
  "max_tokens": 150,
  "temperature": 0.7
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Example Response</h3>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">200</Badge>
                    <span className="text-slate-400">Successful</span>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap">
                    {activeEndpoint === 'chat' ?
                      `{
  "id": "chatcmpl-abc123",
  "object": "chat.completion", 
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The meaning of life..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 67,
    "total_tokens": 92
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

              <div className="pt-4 border-t border-slate-700">
                <Button
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  data-testid="try-it-button"
                  onClick={handleTryIt}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Try It Live
                </Button>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Opens interactive API testing interface
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}