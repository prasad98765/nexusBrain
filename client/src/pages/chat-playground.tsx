import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Send,
    Settings2,
    Copy,
    RotateCcw,
    Edit2,
    CheckCheck,
    Sparkles,
    Loader2,
    User,
    Square,
    X,
    Check,
    MessageSquare,
    MoreVertical,
    PanelLeftClose,
    PanelLeft,
    ChevronsUpDown,
    ThumbsUp,
    ThumbsDown,
    Share,
    Lightbulb,
    ListOrdered,
    Minimize2,
    Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

interface ModelConfig {
    model: string;
    max_tokens: number;
    temperature: number;
    stream: boolean;
    cache_threshold: number;
    is_cached: boolean;
    use_rag: boolean
}

export default function ChatPlayground() {
    const isMobile = useIsMobile()
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [modelSearchOpen, setModelSearchOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();

    const [config, setConfig] = useState<ModelConfig>({
        model: 'meta-llama/llama-3.3-8b-instruct:free',
        max_tokens: 300,
        temperature: 0.5,
        stream: true,
        cache_threshold: 0.5,
        is_cached: false,
        use_rag: false
    });

    // Fetch available models
    const { data: availableModels = [] } = useQuery<Array<{ id: string; name: string }>>({
        queryKey: ['available-models-playground'],
        queryFn: async () => {
            const response = await fetch('/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            return data.data?.map((model: any) => ({
                id: model.id,
                name: model.name || model.id
            })) || [];
        },
        enabled: !!token,
        staleTime: 10 * 60 * 1000,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (isMobile) setSidebarOpen(false);
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            // Reset height to recalculate
            textareaRef.current.style.height = '24px'; // Min height for 1 line

            // Calculate new height based on content
            const scrollHeight = textareaRef.current.scrollHeight;
            const newHeight = Math.min(scrollHeight, 200); // Max 200px

            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [input]);
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, []);
    useEffect(() => {
        if (!token) {
            toast({
                title: 'Invalid Access',
                description: 'No authentication token provided. Please use the link from API Integrations page.',
                variant: 'destructive'
            });
        }
    }, [token, toast]);

    const sendMessage = async (content: string, isRetry = false, parentMessages?: Message[]) => {
        if (!content.trim() || !token) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        const baseMessages = parentMessages || messages;
        const newMessages = isRetry ? baseMessages : [...baseMessages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true
        };
        setMessages([...newMessages, assistantMessage]);

        const controller = new AbortController();
        setAbortController(controller);

        try {
            const requestBody = {
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant.'
                    },
                    ...newMessages
                        .filter(m => m.role !== 'system')
                        .map(m => ({ role: m.role, content: m.content }))
                ],
                max_tokens: config.max_tokens,
                temperature: config.temperature,
                stream: config.stream,
                cache_threshold: config.cache_threshold,
                is_cached: config.is_cached,
                use_rag: config.use_rag
            };

            const response = await fetch(`${process.env.BACKEND_URL}/api/v1/chat/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json',
                    "internal": "true"
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            if (config.stream && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    accumulatedContent += content;
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        const lastMsg = updated[updated.length - 1];
                                        if (lastMsg.role === 'assistant') {
                                            lastMsg.content = accumulatedContent;
                                        }
                                        return updated;
                                    });
                                }
                            } catch (e) {
                                console.error('Parse error:', e);
                            }
                        }
                    }
                }

                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.isStreaming = false;
                    }
                    return updated;
                });
            } else {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || 'No response';
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = content;
                        lastMsg.isStreaming = false;
                    }
                    return updated;
                });
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast({
                    title: 'Request Stopped',
                    description: 'The request was stopped by user.'
                });
            } else {
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to send message',
                    variant: 'destructive'
                });
            }
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
            setAbortController(null);
        }
    };

    const handleStop = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setIsLoading(false);
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        toast({
            title: 'Copied!',
            description: 'Message copied to clipboard.'
        });
    };

    const handleRetry = (messageIndex: number) => {
        const userMessages = messages.slice(0, messageIndex).filter(m => m.role === 'user');
        const lastUserMsg = userMessages[userMessages.length - 1];
        if (lastUserMsg) {
            const messagesUpToRetry = messages.slice(0, messageIndex);
            sendMessage(lastUserMsg.content, true, messagesUpToRetry);
        }
    };

    const handleEdit = (messageId: string, content: string) => {
        setEditingMessageId(messageId);
        setEditedContent(content);
    };

    const handleSaveEdit = (messageIndex: number) => {
        const updatedMessages = messages.slice(0, messageIndex);
        const editedMessage = messages[messageIndex];
        updatedMessages.push({ ...editedMessage, content: editedContent });
        setMessages(updatedMessages);
        sendMessage(editedContent, true, updatedMessages);
        setEditingMessageId(null);
        setEditedContent('');
    };

    const handleTextSelection = () => {
        const selection = window.getSelection()?.toString();
        if (selection) {
            setSelectedText(selection);
            setInput(`Explain the following: "${selection}"`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const newChat = () => {
        setMessages([]);
        setInput('');
        setSelectedText('');
    };

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#212121]">
                <div className="text-center space-y-4">
                    <div className="text-red-400 text-xl">⚠️ Invalid Access</div>
                    <p className="text-slate-400">Please use the link from the API Integrations page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#212121] text-white overflow-hidden">
            {/* Left Sidebar */}
            <div className={cn(
                "flex flex-col bg-[#171717] border-r border-[#2f2f2f] transition-all duration-300",
                sidebarOpen ? "w-64" : "w-0"
            )}>
                {sidebarOpen && (
                    <>
                        <div className="flex items-center justify-between p-3 border-b border-[#2f2f2f]">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-semibold text-sm">Nexus</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 md:hidden hover:bg-[#2f2f2f]"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-2">
                            <Button
                                onClick={newChat}
                                className="w-full justify-start bg-transparent hover:bg-[#2f2f2f] text-white border border-[#2f2f2f] h-10"
                                variant="outline"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                New chat
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 px-2">
                            <div className="space-y-1 py-2">
                                <div className="px-2 py-1.5 text-xs text-slate-500 font-medium">Today</div>
                                {messages.length > 0 && (
                                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2f2f2f] text-sm transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                                <span className="truncate text-slate-300">
                                                    {messages.find(m => m.role === 'user')?.content.slice(0, 30) || 'New conversation'}...
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="border-t border-[#2f2f2f] p-2 space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-10 text-slate-300 hover:bg-[#2f2f2f]"
                                onClick={() => setSettingsOpen(true)}
                            >
                                <Settings2 className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f]">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-[#2f2f2f]"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                        </Button>
                        <span className="text-sm font-medium text-slate-300">Nexus Chat</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-[#2f2f2f] md:hidden"
                        onClick={newChat}
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1" onMouseUp={handleTextSelection}>
                    <div className="max-w-3xl mx-auto">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-semibold text-white mb-2">How can I help you today?</h2>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "group py-6 px-4 md:px-6",
                                    message.role === 'assistant' ? 'bg-[#2f2f2f]' : 'bg-transparent'
                                )}
                            >
                                <div className="max-w-3xl mx-auto">
                                    <div className={cn(
                                        "flex gap-4",
                                        message.role === 'user' ? 'flex-row-reverse' : ''
                                    )}>
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                message.role === 'user'
                                                    ? 'bg-[#19c37d]'
                                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                            )}>
                                                {message.role === 'user' ? (
                                                    <User className="w-4 h-4 text-white" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Message Content */}
                                        <div className={cn(
                                            "flex-1 min-w-0",
                                            message.role === 'user' ? 'flex flex-col items-end' : ''
                                        )}>
                                            <div className={cn(
                                                "font-semibold text-sm mb-2",
                                                message.role === 'user' ? 'text-right' : 'text-left'
                                            )}>
                                                {message.role === 'user' ? 'You' : 'Nexus'}
                                            </div>

                                            {editingMessageId === message.id ? (
                                                <div className="space-y-3">
                                                    <Textarea
                                                        value={editedContent}
                                                        onChange={(e) => setEditedContent(e.target.value)}
                                                        className="bg-[#40414f] border-[#565869] text-white min-h-[100px] resize-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSaveEdit(index)}
                                                            className="bg-[#19c37d] hover:bg-[#1a7f5a] text-white"
                                                        >
                                                            <CheckCheck className="w-4 h-4 mr-1" />
                                                            Save & Submit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setEditingMessageId(null)}
                                                            className="border-[#565869] hover:bg-[#40414f]"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={cn(
                                                        "prose prose-invert max-w-none text-[15px] leading-7",
                                                        message.role === 'user' ? 'text-right' : 'text-left'
                                                    )}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                    {message.isStreaming && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                        </div>
                                                    )}

                                                    {/* Message Actions */}
                                                    {!message.isStreaming && (
                                                        <div className={cn(
                                                            "flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity",
                                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                                        )}>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleCopy(message.content)}
                                                                className="h-7 px-2 hover:bg-[#40414f] text-slate-400 hover:text-white"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </Button>
                                                            {message.role === 'user' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleEdit(message.id, message.content)}
                                                                    className="h-7 px-2 hover:bg-[#40414f] text-slate-400 hover:text-white"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                            {message.role === 'assistant' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleRetry(index)}
                                                                        className="h-7 px-2 hover:bg-[#40414f] text-slate-400 hover:text-white"
                                                                    >
                                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-7 px-2 hover:bg-[#40414f] text-slate-400 hover:text-white"
                                                                            >
                                                                                <MoreVertical className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent className="bg-[#2f2f2f] border-[#565869]">
                                                                            <DropdownMenuItem className="hover:bg-[#40414f] cursor-pointer text-white">
                                                                                <Lightbulb className="w-4 h-4 mr-2" />
                                                                                Ask to change response
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator className="bg-[#565869]" />
                                                                            <DropdownMenuItem className="hover:bg-[#40414f] cursor-pointer text-white">
                                                                                <ThumbsUp className="w-4 h-4 mr-2" />
                                                                                Good response
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="hover:bg-[#40414f] cursor-pointer text-white">
                                                                                <ThumbsDown className="w-4 h-4 mr-2" />
                                                                                Bad response
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-[#2f2f2f] p-4 bg-[#212121]">
                    <div className="max-w-3xl mx-auto">
                        {selectedText && (
                            <div className="mb-2 p-2 bg-[#2f2f2f] rounded-lg text-sm flex items-center justify-between">
                                <span className="text-slate-400 truncate">Selected: {selectedText.slice(0, 50)}...</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedText('')}
                                    className="hover:bg-[#40414f]"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        <div className="relative flex items-end gap-2 bg-[#40414f] rounded-3xl px-4 py-3 border border-[#565869] focus-within:border-slate-500">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask anything..."
                                className="flex-1 bg-transparent border-none resize-none min-h-[24px] max-h-[200px] text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[15px] leading-6 overflow-y-auto"
                                style={{ height: '24px' }}
                                rows={1}
                                disabled={isLoading}
                            />
                            {isLoading ? (
                                <Button
                                    onClick={handleStop}
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-white hover:bg-slate-200 text-black flex-shrink-0"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim()}
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-white hover:bg-slate-200 text-black disabled:opacity-30 disabled:hover:bg-white flex-shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        <div className="text-xs text-center text-slate-500 mt-2">
                            Nexus Chat can make mistakes. Check important info.
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Sheet */}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetContent side="right" className="bg-[#171717] border-[#2f2f2f] text-white w-80 sm:w-96">
                    <SheetHeader>
                        <SheetTitle className="text-white">Model Configuration</SheetTitle>
                        <SheetDescription className="text-slate-400">
                            Adjust model parameters and settings
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {/* Model Selection with Search */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Model</Label>
                            <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={modelSearchOpen}
                                        className="w-full justify-between bg-[#2f2f2f] border-[#565869] hover:bg-[#40414f] text-white h-10"
                                    >
                                        <span className="truncate text-sm">
                                            {availableModels.find((m) => m.id === config.model)?.name || config.model}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    sideOffset={4}
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    className="w-[320px] p-0 bg-[#2f2f2f] border-[#565869] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out"
                                >
                                    <Command className="bg-[#2f2f2f]" shouldFilter={true}>
                                        <CommandInput
                                            placeholder="Search models..."
                                            className="h-9 border-none bg-[#2f2f2f] text-white placeholder:text-slate-500"
                                        />
                                        {/* ✅ Scrollable area only for results — not wrapping entire Command */}
                                        <CommandList
                                            className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#565869] scrollbar-track-transparent"
                                            style={{
                                                overscrollBehavior: 'contain',
                                                WebkitOverflowScrolling: 'touch',
                                            }}
                                            onWheel={(e) => e.stopPropagation()} // 🧠 still blocks Radix wheel capture
                                        >
                                            <CommandEmpty className="py-6 text-center text-sm text-slate-400">
                                                No model found.
                                            </CommandEmpty>
                                            <CommandGroup className="bg-[#2f2f2f] p-1">
                                                {availableModels.map((model) => (
                                                    <CommandItem
                                                        key={model.id}
                                                        value={model.name}
                                                        onSelect={() => {
                                                            setConfig({ ...config, model: model.id });
                                                            setModelSearchOpen(false);
                                                        }}
                                                        className="hover:bg-[#40414f] cursor-pointer text-white aria-selected:bg-[#40414f]"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4 flex-shrink-0',
                                                                config.model === model.id ? 'opacity-100' : 'opacity-0'
                                                            )}
                                                        />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="text-sm truncate">{model.name}</span>
                                                            <span className="text-xs text-slate-500 truncate">{model.id}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>



                            </Popover>
                        </div>

                        {/* Max Tokens */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Max Tokens: {config.max_tokens}</Label>
                            <Slider
                                value={[config.max_tokens]}
                                onValueChange={(v) => setConfig({ ...config, max_tokens: v[0] })}
                                min={50}
                                max={4000}
                                step={50}
                                className="py-2"
                            />
                        </div>

                        {/* Temperature */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Temperature: {config.temperature}</Label>
                            <Slider
                                value={[config.temperature]}
                                onValueChange={(v) => setConfig({ ...config, temperature: v[0] })}
                                min={0}
                                max={2}
                                step={0.1}
                                className="py-2"
                            />
                        </div>

                        {/* Cache Threshold */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Cache Threshold: {config.cache_threshold}</Label>
                            <Slider
                                value={[config.cache_threshold]}
                                onValueChange={(v) => setConfig({ ...config, cache_threshold: v[0] })}
                                min={0}
                                max={1}
                                step={0.1}
                                className="py-2"
                            />
                        </div>

                        {/* Stream Toggle */}
                        <div className="flex items-center justify-between py-2">
                            <Label className="text-sm font-medium">Stream Responses</Label>
                            <Switch
                                checked={config.stream}
                                onCheckedChange={(checked) => setConfig({ ...config, stream: checked })}
                            />
                        </div>

                        {/* Is Cached Toggle */}
                        <div className="flex items-center justify-between py-2">
                            <Label className="text-sm font-medium">Use Cache</Label>
                            <Switch
                                checked={config.is_cached}
                                onCheckedChange={(checked) => setConfig({ ...config, is_cached: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <Label className="text-sm font-medium">Use Rag</Label>
                            <Switch
                                checked={config.use_rag}
                                onCheckedChange={(checked) => setConfig({ ...config, use_rag: checked })}
                            />
                        </div>

                        {/* Current Config Display */}
                        <div className="mt-6 p-4 bg-[#2f2f2f] rounded-lg border border-[#565869]">
                            <div className="text-xs text-slate-400 mb-2 font-medium">Current Configuration:</div>
                            <pre className="text-xs text-slate-300 overflow-auto">
                                {JSON.stringify(config, null, 2)}
                            </pre>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
