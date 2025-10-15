import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import systemPrompt from './systemPrompt.txt?raw';

interface Message {
    role: 'bot' | 'user' | 'system';
    content: string;
    isStreaming?: boolean;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset chat when bot is closed (end session)
    const handleClose = () => {
        // Abort any ongoing requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setIsOpen(false);

        // Reset session immediately - clear all chat history
        setTimeout(() => {
            setHasStarted(false);
            setMessages([]);
            setInputValue('');
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }, 300);
    };

    // Open bot and show initial message
    const handleOpen = () => {
        setIsOpen(true);
        setMessages([{
            role: 'system',
            content: 'This bot does not maintain any session. If you start again, it will be treated as a new session.'
        }]);
    };

    // Start the conversation
    const handleStart = () => {
        setHasStarted(true);
        setMessages([{
            role: 'bot',
            content: '💬 Welcome to Nexus AI Hub! What can we help you with today?'
        }]);
    };

    // Handle streaming response from API
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setIsStreaming(true);

        // Add empty bot message that will be filled with streaming content
        const botMessageIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: 'bot', content: '', isStreaming: true }]);

        try {
            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();

            // Build messages array for API (convert 'bot' to 'assistant', exclude UI 'system' messages)
            const apiMessages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...messages
                    .filter(msg => msg.role !== 'system') // Exclude UI system messages
                    .map(msg => ({
                        role: msg.role === 'bot' ? 'assistant' : 'user',
                        content: msg.content
                    })),
                {
                    role: 'user',
                    content: userMessage
                }
            ];

            const response = await fetch('/api/v1/chat/create', {
                method: 'POST',
                headers: {
                    'authorization': 'Bearer nxs-aXkDVM7aAVNVuVcYa6FqoLDD98fHIwOF4VVX-tkcHgs',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.3-8b-instruct:free',
                    messages: apiMessages,
                    max_tokens: 500,
                    temperature: 0.5,
                    stream: true,
                    cache_threshold: 0.50,
                    is_cached: false,
                    use_rag: false
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();

                            if (data === '[DONE]') {
                                setIsStreaming(false);
                                setIsLoading(false);
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const text = parsed.choices?.[0]?.delta?.content || '';

                                if (text) {
                                    accumulatedText += text;

                                    // Update the bot message with accumulated text
                                    setMessages(prev => {
                                        const newMessages = [...prev];
                                        newMessages[botMessageIndex] = {
                                            role: 'bot',
                                            content: accumulatedText,
                                            isStreaming: true
                                        };
                                        return newMessages;
                                    });
                                }
                            } catch (e) {
                                // Skip invalid JSON chunks
                                console.warn('Failed to parse chunk:', data);
                            }
                        }
                    }
                }
            }

            // Mark streaming as complete
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[botMessageIndex]) {
                    newMessages[botMessageIndex].isStreaming = false;
                }
                return newMessages;
            });

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }

            console.error('Error sending message:', error);

            // Show error message
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[botMessageIndex] = {
                    role: 'bot',
                    content: '❌ Sorry, I encountered an error. Please try again.',
                    isStreaming: false
                };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Floating Bot Button */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-full shadow-lg hover:shadow-indigo-500/50 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300 z-50 group"
                    aria-label="Open AI Chat Bot"
                >
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:animate-pulse" />

                    {/* Pulse ring animation */}
                    <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[410px] max-w-[95vw] h-[calc(100vh-2rem)] sm:h-[600px] max-h-[90vh] z-50 animate-fade-in-scale">
                    <Card className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
                        {/* Header */}
                        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-lg font-bold text-white">Nexus AI Assistant</h3>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] sm:text-xs text-slate-400">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800/50 rounded-lg active:scale-95"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </CardHeader>

                        {/* Chat Messages */}
                        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-900/50">
                            {messages
                                .filter(msg => msg.content !== '') // Don't show empty bot messages
                                .map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.role === 'system' ? (
                                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 sm:p-4 max-w-[90%] sm:max-w-[85%]">
                                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs sm:text-sm text-amber-200">{message.content}</p>
                                            </div>
                                        ) : (
                                            <div
                                                className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-[85%] ${message.role === 'user'
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                    : 'bg-slate-800/80 border border-slate-700/50 text-slate-100'
                                                    }`}
                                            >
                                                <div className="text-xs sm:text-sm leading-relaxed markdown-content">
                                                    <ReactMarkdown
                                                        // remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            // Headings
                                                            h1: ({ ...props }) => <h1 className="text-base sm:text-lg font-bold mb-2 mt-3" {...props} />,
                                                            h2: ({ ...props }) => <h2 className="text-sm sm:text-base font-bold mb-2 mt-2" {...props} />,
                                                            h3: ({ ...props }) => <h3 className="text-xs sm:text-sm font-bold mb-1 mt-2" {...props} />,
                                                            // Paragraphs
                                                            p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            // Lists
                                                            ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2" {...props} />,
                                                            ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2" {...props} />,
                                                            li: ({ ...props }) => <li className="text-xs sm:text-sm" {...props} />,
                                                            // Links
                                                            a: ({ ...props }) => (
                                                                <a
                                                                    className="text-cyan-400 hover:text-cyan-300 underline"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    {...props}
                                                                />
                                                            ),
                                                            // Bold and Italic
                                                            strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                                                            em: ({ ...props }) => <em className="italic" {...props} />,
                                                            // Code
                                                            code: ({ inline, ...props }: any) =>
                                                                inline ? (
                                                                    <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                                                ) : (
                                                                    <code className="block bg-slate-700/50 p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props} />
                                                                ),
                                                            pre: ({ ...props }) => <pre className="bg-slate-700/50 p-2 rounded overflow-x-auto my-2" {...props} />,
                                                            // Blockquote
                                                            blockquote: ({ ...props }) => (
                                                                <blockquote className="border-l-4 border-slate-600 pl-3 py-1 my-2 italic" {...props} />
                                                            ),
                                                            // Table
                                                            table: ({ ...props }) => (
                                                                <div className="overflow-x-auto my-2">
                                                                    <table className="min-w-full border-collapse border border-slate-600 text-xs" {...props} />
                                                                </div>
                                                            ),
                                                            thead: ({ ...props }) => <thead className="bg-slate-700/50" {...props} />,
                                                            tbody: ({ ...props }) => <tbody {...props} />,
                                                            tr: ({ ...props }) => <tr className="border-b border-slate-600" {...props} />,
                                                            th: ({ ...props }) => <th className="border border-slate-600 px-2 py-1 text-left font-semibold" {...props} />,
                                                            td: ({ ...props }) => <td className="border border-slate-600 px-2 py-1" {...props} />,
                                                            // Horizontal rule
                                                            hr: ({ ...props }) => <hr className="my-2 border-slate-600" {...props} />,
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                            {/* Loading indicator - Three dots */}
                            {isLoading && messages[messages.length - 1]?.content === '' && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce animation-delay-200" />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce animation-delay-400" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </CardContent>

                        {/* Input Area or Start Button */}
                        <div className="p-3 sm:p-4 border-t border-slate-700/50 bg-slate-900/50">
                            {!hasStarted ? (
                                <Button
                                    onClick={handleStart}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-5 sm:py-6 text-sm sm:text-base"
                                >
                                    Start Conversation
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your message..."
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 text-sm sm:text-base"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !inputValue.trim()}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 sm:px-4"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
