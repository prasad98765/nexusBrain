import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStarted(false);
      setMessages([]);
      setInputValue('');
      setStreamingMessage('');
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
    setStreamingMessage('');

    try {
      const response = await fetch('/api/webbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Stream complete - add final message
                if (accumulatedContent) {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: accumulatedContent
                  }]);
                  setStreamingMessage('');
                }
                setIsLoading(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  accumulatedContent += content;
                  setStreamingMessage(accumulatedContent);
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }

      // Fallback if stream doesn't end properly
      if (accumulatedContent) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: accumulatedContent
        }]);
      }
      setStreamingMessage('');
      setIsLoading(false);

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from bot',
        variant: 'destructive'
      });
      setIsLoading(false);
      setStreamingMessage('');
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
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
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
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[75%] rounded-lg p-3 bg-slate-700 text-slate-100">
                  <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                </div>
              </div>
            )}
            
            {/* Typing indicator */}
            {isLoading && !streamingMessage && (
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