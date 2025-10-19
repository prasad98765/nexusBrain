import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useModelStore } from '@/store/modelStore';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User, Sparkles, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatConfig {
  model: string;
  temperature: number;
  cacheThreshold: number;
  isCached: boolean;
  isStreaming: boolean;
}

// Simple markdown renderer component
function MarkdownText({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);

    return parts.map((part, index) => {
      // Handle code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        return (
          <pre key={index} className="bg-slate-900 rounded p-2 my-2 overflow-x-auto">
            <code className="text-sm text-green-400">{code}</code>
          </pre>
        );
      }

      // Handle inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-slate-700 px-1 py-0.5 rounded text-sm text-green-400">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle regular text with bold and italic
      const segments: (string | JSX.Element)[] = [];
      let remaining = part;
      let segmentKey = 0;

      while (remaining) {
        // Match **bold**
        const boldMatch = remaining.match(/\*\*([^\*]+)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
          if (boldMatch.index > 0) {
            segments.push(remaining.slice(0, boldMatch.index));
          }
          segments.push(
            <strong key={`${index}-${segmentKey++}`} className="font-bold text-white">
              {boldMatch[1]}
            </strong>
          );
          remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
          continue;
        }

        // Match *italic*
        const italicMatch = remaining.match(/\*([^\*]+)\*/);
        if (italicMatch && italicMatch.index !== undefined) {
          if (italicMatch.index > 0) {
            segments.push(remaining.slice(0, italicMatch.index));
          }
          segments.push(
            <em key={`${index}-${segmentKey++}`} className="italic">
              {italicMatch[1]}
            </em>
          );
          remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
          continue;
        }

        // No more matches, add remaining text
        segments.push(remaining);
        break;
      }

      return <span key={index}>{segments}</span>;
    });
  };

  return <div className="text-sm whitespace-pre-wrap">{renderMarkdown(content)}</div>;
}

interface WebBotChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WebBotChat({ isOpen, onClose }: WebBotChatProps) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const { models } = useModelStore();
  const [config, setConfig] = useState<ChatConfig>({
    model: 'meta-llama/llama-3.3-8b-instruct:free',
    temperature: 0.7,
    cacheThreshold: 0.8,
    isCached: true,
    isStreaming: true,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  // Load models when component mounts
  const { fetchModelsAndProviders } = useModelStore();
  useEffect(() => {
    if (token) {
      fetchModelsAndProviders(token).catch((error) => {
        toast({
          title: "Error",
          description: "Failed to load models. Please try again later.",
          variant: "destructive"
        });
      });
    }
  }, [fetchModelsAndProviders, token, toast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStarted(false);
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleStart = () => {
    setStarted(true);
    setMessages([
      {
        role: 'assistant',
        content: 'Hello, welcome to Nexus AI Hub. What can we help you with today?'
      }
    ]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/webbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages,
          model: config.model,
          temperature: config.temperature,
          cache_threshold: config.cacheThreshold,
          use_cache: config.isCached,
          stream: config.isStreaming
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Check if it's a streaming response
      const contentType = response.headers.get('content-type');
      const isStreamingResponse = contentType?.includes('text/event-stream');

      if (isStreamingResponse) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamedContent = '';

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Decode chunk and process SSE messages
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) throw new Error(parsed.error);

                    // Handle both delta and full message formats
                    const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
                    if (content) {
                      streamedContent += content;
                      // Update UI with streamed content
                      setMessages(prev => {
                        const newMessages = [...prev];
                        // Update or add assistant message
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === 'assistant') {
                          lastMessage.content = streamedContent;
                        } else {
                          newMessages.push({
                            role: 'assistant',
                            content: streamedContent
                          });
                        }
                        return newMessages;
                      });
                    }
                  } catch (e) {
                    if (data !== '[DONE]') {
                      console.error('Parse error:', e, 'Data:', data);
                    }
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      } else {
        // Handle non-streaming response
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: content
          }]);
        }
      }

      setIsLoading(false);

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from bot',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Nexus AI Assistant</h3>
            <p className="text-xs text-indigo-100">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(true)}
            className="text-white hover:bg-white/20"
            data-testid="button-config-webbot"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-webbot"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Configuration Modal */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="bg-slate-800 text-white border border-slate-700">
          <DialogHeader>
            <DialogTitle>Chat Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={config.model}
                onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperature: {config.temperature}</Label>
              <Slider
                value={[config.temperature]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
                min={0}
                max={1}
                step={0.1}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label>Cache Threshold: {config.cacheThreshold}</Label>
              <Slider
                value={[config.cacheThreshold]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, cacheThreshold: value }))}
                min={0.1}
                max={0.99}
                step={0.01}
                className="py-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Cache</Label>
              <Switch
                checked={config.isCached}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isCached: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Streaming</Label>
              <Switch
                checked={config.isStreaming}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isStreaming: checked }))}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <div className="text-center space-y-3">
            <h4 className="text-lg font-semibold text-slate-100">Welcome to Testing Bot</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p>• This bot is for testing purposes and uses your stored API key to get responses.</p>
              <p>• If you close the bot or refresh the page, the session will end. A new session will always start fresh.</p>
              <p>• All usage and questions will be stored in logs.</p>
            </div>
          </div>

          <Button
            onClick={handleStart}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            data-testid="button-start-webbot"
          >
            Start Conversation
          </Button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                    }`}
                >
                  <MarkdownText content={message.content} />
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                data-testid="input-webbot-message"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="button-send-webbot-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}