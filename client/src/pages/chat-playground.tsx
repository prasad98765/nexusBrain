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
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
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

interface ThemeSettings {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    font_style: string;
    button_style: string;
    logo_url: string;
    ai_search_engine_name: string;
    theme_preset: string;
    welcome_message: string;
}

interface QuickButton {
    id: string;
    label: string;
    text: string;
    emoji?: string;
}

export default function ChatPlayground() {
    const isMobile = useIsMobile()
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const clientId = searchParams.get('client_id');
    const siteId = searchParams.get('site_id');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [showAskToNexus, setShowAskToNexus] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [modelSearchOpen, setModelSearchOpen] = useState(false);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
    const [quickButtons, setQuickButtons] = useState<QuickButton[]>([]);
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

    // Fetch theme settings and model config if client_id is provided
    useEffect(() => {
        const fetchTheme = async () => {
            if (clientId) {
                try {
                    const response = await fetch(`/api/script/${clientId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setThemeSettings(data.theme_settings);
                        setQuickButtons(data.quick_buttons || []);
                        // Use model config from API if available
                        if (data.model_config) {
                            setConfig(data.model_config);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch theme settings:', error);
                }
            }
        };
        fetchTheme();
    }, [clientId]);

    // Apply theme to document
    useEffect(() => {
        if (themeSettings) {
            document.documentElement.style.setProperty('--theme-primary', themeSettings.primary_color);
            document.documentElement.style.setProperty('--theme-secondary', themeSettings.secondary_color);
            document.documentElement.style.setProperty('--theme-background', themeSettings.background_color);
            document.documentElement.style.setProperty('--theme-font', themeSettings.font_style);

            // Apply font to body
            document.body.style.fontFamily = `'${themeSettings.font_style}', sans-serif`;
        }
    }, [themeSettings]);

    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    //     if (isMobile) setSidebarOpen(false);

    //     // Auto-focus input after assistant message
    //     if (messages.length > 0) {
    //         const lastMessage = messages[messages.length - 1];
    //         if (lastMessage.role === 'assistant' && !lastMessage.isStreaming && !isLoading) {
    //             // Small delay to ensure smooth scroll completes first
    //             setTimeout(() => {
    //                 textareaRef.current?.focus();
    //             }, 100);
    //         }
    //     }
    // }, [messages, isLoading]);

    // Auto-scroll to bottom when messages change or streaming updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            // Reset height to recalculate
            textareaRef.current.style.height = '45px'; // Min height for 1 line

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

            const response = await fetch(`/api/v1/chat/create`, {
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.statusText}`);
            }

            if (config.stream && response.body) {
                // Check if response is actually streaming or just a cached JSON response
                const contentType = response.headers.get('content-type');
                const isActuallyStreaming = contentType?.includes('text/event-stream');

                if (isActuallyStreaming) {
                    // Streaming response handling
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

                    // Mark streaming as complete
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.isStreaming = false;
                        }
                        return updated;
                    });
                } else {
                    // Cached response returned as JSON even though stream was requested
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || 'No response Please try again.';
                    const isCached = data.cached || data.cache_hit || false;
                    const cacheType = data.cache_type;

                    setMessages(prev => {
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content = content;
                            lastMsg.isStreaming = false;
                        }
                        return updated;
                    });

                    // Show toast if response was cached
                    if (isCached) {
                        toast({
                            title: '⚡ Cached Response',
                            description: `Response served from cache (${cacheType || 'unknown'} match)`,
                            duration: 2000
                        });
                    }
                }
            } else {
                // Non-streaming response handling
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || 'No response Please try again.';
                const isCached = data.cached || data.cache_hit || false;
                const cacheType = data.cache_type;

                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = content;
                        lastMsg.isStreaming = false;
                    }
                    return updated;
                });

                // Show toast if response was cached
                if (isCached) {
                    toast({
                        title: '⚡ Cached Response',
                        description: `Response served from cache (${cacheType || 'unknown'} match)`,
                        duration: 2000
                    });
                }
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
            // Remove the empty assistant message on error
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
        if (selection && selection.trim()) {
            setSelectedText(selection);
            setShowAskToNexus(true);
        } else {
            setSelectedText('');
            setShowAskToNexus(false);
        }
    };

    const handleAskToNexus = () => {
        if (selectedText && selectedText.trim()) {
            const promptText = `Explain the following: "${selectedText}"`;
            setInput(promptText);
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
            setShowAskToNexus(false);
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
        <div
            className="flex h-screen text-white overflow-hidden"
            style={{
                backgroundColor: themeSettings?.background_color || '#212121',
                color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff'
            }}
        >
            {/* Left Sidebar */}
            {!siteId ? <div
                className={cn(
                    "flex flex-col border-r transition-all duration-300",
                    sidebarOpen ? "w-64" : "w-0"
                )}
                style={{
                    backgroundColor: themeSettings?.theme_preset === 'light' ? '#f3f4f6' : '#171717',
                    borderColor: themeSettings?.theme_preset === 'light' ? '#e5e7eb' : '#2f2f2f'
                }}
            >
                {sidebarOpen && (
                    <>
                        <div
                            className="flex items-center justify-between p-3 border-b"
                            style={{ borderColor: themeSettings?.theme_preset === 'light' ? '#e5e7eb' : '#2f2f2f' }}
                        >
                            <div className="flex items-center gap-2">
                                {themeSettings?.logo_url ? (
                                    <img src={themeSettings.logo_url} alt="Logo" className="w-7 h-7 rounded-sm object-cover" />
                                ) : (
                                    <div
                                        className="w-7 h-7 rounded-sm flex items-center justify-center"
                                        style={{ background: `linear-gradient(to bottom right, ${themeSettings?.primary_color || '#6366f1'}, ${themeSettings?.secondary_color || '#8b5cf6'})` }}
                                    >
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <span
                                    className="font-semibold text-sm"
                                    style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                                >
                                    {themeSettings?.ai_search_engine_name || 'Nexus'}
                                </span>
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
                                className={cn(
                                    "w-full justify-start h-10",
                                    themeSettings?.button_style === 'rounded' && 'rounded-full',
                                    themeSettings?.button_style === 'square' && 'rounded-none'
                                )}
                                variant="outline"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: themeSettings?.secondary_color || '#2f2f2f',
                                    color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff'
                                }}
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

                        <div
                            className="border-t p-2 space-y-1"
                            style={{ borderColor: themeSettings?.theme_preset === 'light' ? '#e5e7eb' : '#2f2f2f' }}
                        >
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-10"
                                onClick={() => setSettingsOpen(true)}
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#4b5563' : '#d1d5db' }}
                            >
                                <Settings2 className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </div>
                    </>
                )}
            </div> : null}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Bar */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: themeSettings?.theme_preset === 'light' ? '#e5e7eb' : '#2f2f2f' }}
                >
                    <div className="flex items-center gap-2">
                        {!siteId ? <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-[#2f2f2f]"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                        </Button> : null}
                        <span
                            className="text-sm font-medium"
                            style={{ color: themeSettings?.theme_preset === 'light' ? '#374151' : '#d1d5db' }}
                        >
                            {themeSettings?.ai_search_engine_name || 'Nexus Chat'}
                        </span>
                    </div>
                    {!siteId ? <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-[#2f2f2f] md:hidden"
                        onClick={newChat}
                    >
                        <Plus className="w-5 h-5" />
                    </Button> : null}
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1" onMouseUp={handleTextSelection}>
                    <div className="max-w-3xl mx-auto relative">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                                {themeSettings?.logo_url ? (
                                    <img src={themeSettings.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover mb-6" />
                                ) : (
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                                        style={{ background: `linear-gradient(to bottom right, ${themeSettings?.primary_color || '#6366f1'}, ${themeSettings?.secondary_color || '#8b5cf6'})` }}
                                    >
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <h2
                                    className="text-3xl font-semibold mb-2"
                                    style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                                >
                                    {themeSettings?.welcome_message || 'How can I help you today?'}
                                </h2>
                            </div>
                        )}

                        {/* Ask to Nexus Button - appears when text is selected */}
                        {/* {showAskToNexus && selectedText && (
                            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                                <div className="bg-[#2f2f2f] border border-[#565869] rounded-lg shadow-xl p-2 flex gap-2">
                                    <Button
                                        onClick={handleAskToNexus}
                                        size="sm"
                                        className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Ask to Nexus
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowAskToNexus(false);
                                            // setSelectedText('');
                                            window.getSelection()?.removeAllRanges();
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="hover:bg-[#40414f] text-slate-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )} */}

                        {messages.map((message, index) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "group py-6 px-4 md:px-6 bg-transparent"
                                )}
                            >
                                <div className="max-w-3xl mx-auto">
                                    <div className={cn(
                                        "flex gap-4",
                                        message.role === 'user' ? 'flex-row-reverse' : ''
                                    )}>
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                                style={{
                                                    backgroundColor: message.role === 'user'
                                                        ? (themeSettings?.primary_color || '#19c37d')
                                                        : 'transparent',
                                                    background: message.role === 'assistant'
                                                        ? `linear-gradient(to bottom right, ${themeSettings?.primary_color || '#6366f1'}, ${themeSettings?.secondary_color || '#8b5cf6'})`
                                                        : undefined
                                                }}
                                            >
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
                                            <div
                                                className={cn(
                                                    "font-semibold text-sm mb-2",
                                                    message.role === 'user' ? 'text-right' : 'text-left'
                                                )}
                                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                                            >
                                                {message.role === 'user' ? 'You' : (themeSettings?.ai_search_engine_name || 'Nexus')}
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
                                                        message.role === 'user' ? 'text-right' : 'text-left',
                                                        // Enhanced prose styles for rich content
                                                        "prose-img:rounded-lg prose-img:shadow-lg prose-img:my-4 prose-img:max-w-full prose-img:h-auto",
                                                        "prose-headings:font-semibold prose-headings:text-white",
                                                        "prose-p:text-slate-200 prose-p:my-2",
                                                        "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
                                                        "prose-strong:text-white prose-strong:font-semibold",
                                                        "prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3",
                                                        "prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3",
                                                        "prose-li:text-slate-200 prose-li:my-1",
                                                        "prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4",
                                                        "prose-code:bg-[#2f2f2f] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-slate-200",
                                                        "prose-pre:bg-[#2f2f2f] prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4",
                                                        "prose-table:border-collapse prose-table:w-full prose-table:my-4",
                                                        "prose-thead:bg-[#2f2f2f]",
                                                        "prose-th:border prose-th:border-slate-600 prose-th:bg-[#2f2f2f] prose-th:p-3 prose-th:text-left prose-th:font-semibold",
                                                        "prose-td:border prose-td:border-slate-600 prose-td:p-3",
                                                        "prose-tr:border-b prose-tr:border-slate-700",
                                                        "prose-hr:border-slate-600 prose-hr:my-6"
                                                    )}>
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                                            components={{
                                                                // Custom image renderer with error handling and card-like styling
                                                                img: ({ node, ...props }) => {
                                                                    const { src, alt, width, height } = props;
                                                                    return (
                                                                        <div className="my-4">
                                                                            <img
                                                                                src={src}
                                                                                alt={alt || 'Image'}
                                                                                width={width}
                                                                                height={height}
                                                                                className="rounded-lg shadow-lg max-w-full h-auto border border-slate-700"
                                                                                loading="lazy"
                                                                                onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement;
                                                                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23333" width="200" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="75" dx="50"%3EImage not found%3C/text%3E%3C/svg%3E';
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                },
                                                                // Custom table renderer with responsive container
                                                                table: ({ node, ...props }) => (
                                                                    <div className="overflow-x-auto my-4 rounded-lg border border-slate-700">
                                                                        <table {...props} className="min-w-full border-collapse" />
                                                                    </div>
                                                                ),
                                                                // Custom code block renderer with syntax highlighting support
                                                                code: ({ node, inline, className, children, ...props }: any) => {
                                                                    const match = /language-(\w+)/.exec(className || '');
                                                                    return !inline ? (
                                                                        <pre className="bg-[#2f2f2f] p-4 rounded-lg overflow-x-auto my-4 border border-slate-700">
                                                                            <code className={className} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        </pre>
                                                                    ) : (
                                                                        <code className="bg-[#2f2f2f] px-1.5 py-0.5 rounded text-sm text-indigo-300" {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                },
                                                                // Custom link renderer with external link handling
                                                                a: ({ node, ...props }) => (
                                                                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors" />
                                                                ),
                                                                // Custom list item renderer
                                                                li: ({ node, ...props }) => (
                                                                    <li {...props} className="my-1 text-slate-200" />
                                                                ),
                                                                // Custom paragraph renderer
                                                                p: ({ node, ...props }) => (
                                                                    <p {...props} className="my-2 text-slate-200 leading-relaxed" />
                                                                ),
                                                                // Custom heading renderers
                                                                h1: ({ node, ...props }) => (
                                                                    <h1 {...props} className="text-2xl font-bold text-white mt-6 mb-4" />
                                                                ),
                                                                h2: ({ node, ...props }) => (
                                                                    <h2 {...props} className="text-xl font-bold text-white mt-5 mb-3" />
                                                                ),
                                                                h3: ({ node, ...props }) => (
                                                                    <h3 {...props} className="text-lg font-semibold text-white mt-4 mb-2" />
                                                                ),
                                                                // Custom horizontal rule
                                                                hr: ({ node, ...props }) => (
                                                                    <hr {...props} className="border-slate-600 my-6" />
                                                                ),
                                                                // Custom blockquote
                                                                blockquote: ({ node, ...props }) => (
                                                                    <blockquote {...props} className="border-l-4 border-indigo-500 pl-4 italic my-4 text-slate-300" />
                                                                ),
                                                            }}
                                                        >
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
                <div
                    className="border-t p-4"
                    style={{
                        borderColor: themeSettings?.theme_preset === 'light' ? '#e5e7eb' : '#2f2f2f',
                        backgroundColor: themeSettings?.background_color || '#212121'
                    }}
                >
                    <div className="max-w-3xl mx-auto">
                        {selectedText && !showAskToNexus && (
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

                        {/* Quick Action Buttons */}
                        {quickButtons && quickButtons.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-4 pb-2">
                                {quickButtons.map((button) => {
                                    const getButtonClassName = () => {
                                        let baseClasses = "px-4 py-2 text-sm font-medium transition-all hover:opacity-80 flex items-center gap-2";

                                        if (themeSettings?.button_style === 'rounded') {
                                            baseClasses += " rounded-full";
                                        } else if (themeSettings?.button_style === 'square') {
                                            baseClasses += " rounded-none";
                                        } else if (themeSettings?.button_style === 'outline') {
                                            baseClasses += " rounded-lg border-2";
                                        } else {
                                            baseClasses += " rounded-lg";
                                        }

                                        return baseClasses;
                                    };

                                    const getButtonStyles = () => {
                                        if (themeSettings?.button_style === 'outline') {
                                            return {
                                                backgroundColor: 'transparent',
                                                borderColor: themeSettings?.primary_color || '#6366f1',
                                                color: themeSettings?.primary_color || '#6366f1'
                                            };
                                        }
                                        return {
                                            backgroundColor: themeSettings?.primary_color || '#6366f1',
                                            color: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#000000'
                                        };
                                    };

                                    return (
                                        <button
                                            key={button.id}
                                            onClick={() => {
                                                // Auto-send message on button click
                                                sendMessage(button.text);
                                            }}
                                            className={getButtonClassName()}
                                            style={getButtonStyles()}
                                            disabled={isLoading}
                                        >
                                            {button.emoji && <span>{button.emoji}</span>}
                                            <span>{button.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div
                            className={cn(
                                "relative flex items-end gap-2 px-4 py-3 border",
                                themeSettings?.button_style === 'rounded' && 'rounded-3xl',
                                themeSettings?.button_style === 'square' && 'rounded-none',
                                !themeSettings?.button_style && 'rounded-3xl'
                            )}
                            style={{
                                backgroundColor: themeSettings?.theme_preset === 'light' ? '#f3f4f6' : '#40414f',
                                borderColor: themeSettings?.secondary_color || '#565869'
                            }}
                        >
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask anything..."
                                className="flex-1 bg-transparent border-none resize-none min-h-[24px] max-h-[200px] placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[15px] leading-6 overflow-y-auto"
                                style={{
                                    color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff',
                                    height: '45px'
                                }}
                                rows={1}
                                disabled={isLoading}
                            />
                            {isLoading ? (
                                <Button
                                    onClick={handleStop}
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 flex-shrink-0",
                                        themeSettings?.button_style === 'rounded' && 'rounded-full',
                                        themeSettings?.button_style === 'square' && 'rounded-none',
                                        !themeSettings?.button_style && 'rounded-lg'
                                    )}
                                    style={{
                                        backgroundColor: themeSettings?.primary_color || '#ffffff',
                                        color: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#000000'
                                    }}
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim()}
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 flex-shrink-0 disabled:opacity-30",
                                        themeSettings?.button_style === 'rounded' && 'rounded-full',
                                        themeSettings?.button_style === 'square' && 'rounded-none',
                                        !themeSettings?.button_style && 'rounded-lg'
                                    )}
                                    style={{
                                        backgroundColor: themeSettings?.primary_color || '#ffffff',
                                        color: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#000000'
                                    }}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        <div
                            className="text-xs text-center mt-2"
                            style={{ color: themeSettings?.theme_preset === 'light' ? '#6b7280' : '#9ca3af' }}
                        >
                            {themeSettings?.ai_search_engine_name || 'Nexus Chat'} can make mistakes. Check important info.
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Sheet */}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetContent
                    side="right"
                    className="w-80 sm:w-96"
                    style={{
                        backgroundColor: themeSettings?.theme_preset === 'light' ? '#f3f4f6' : '#171717',
                        borderColor: themeSettings?.theme_preset === 'light' ? '#e5e7eb' : '#2f2f2f',
                        color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff'
                    }}
                >
                    <SheetHeader>
                        <SheetTitle
                            style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                        >
                            Model Configuration
                        </SheetTitle>
                        <SheetDescription
                            style={{ color: themeSettings?.theme_preset === 'light' ? '#6b7280' : '#9ca3af' }}
                        >
                            Configure model parameters for testing only.
                            (These settings are temporary and will not be saved.)
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {/* Model Selection with Search */}
                        <div className="space-y-2">
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Model
                            </Label>
                            <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={modelSearchOpen}
                                        className="w-full justify-between h-10"
                                        style={{
                                            backgroundColor: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#2f2f2f',
                                            borderColor: themeSettings?.secondary_color || '#565869',
                                            color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff'
                                        }}
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
                                    className="w-[320px] p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out"
                                    style={{
                                        backgroundColor: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#2f2f2f',
                                        borderColor: themeSettings?.secondary_color || '#565869'
                                    }}
                                >
                                    <Command
                                        className=""
                                        shouldFilter={true}
                                        style={{ backgroundColor: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#2f2f2f' }}
                                    >
                                        <CommandInput
                                            placeholder="Search models..."
                                            className="h-9 border-none placeholder:text-slate-500"
                                            style={{
                                                backgroundColor: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#2f2f2f',
                                                color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff'
                                            }}
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
                                            <CommandEmpty
                                                className="py-6 text-center text-sm"
                                                style={{ color: themeSettings?.theme_preset === 'light' ? '#6b7280' : '#9ca3af' }}
                                            >
                                                No model found.
                                            </CommandEmpty>
                                            <CommandGroup
                                                className="p-1"
                                                style={{ backgroundColor: themeSettings?.theme_preset === 'light' ? '#ffffff' : '#2f2f2f' }}
                                            >
                                                {availableModels.map((model) => (
                                                    <CommandItem
                                                        key={model.id}
                                                        value={model.name}
                                                        onSelect={() => {
                                                            setConfig({ ...config, model: model.id });
                                                            setModelSearchOpen(false);
                                                        }}
                                                        className="cursor-pointer"
                                                        style={{
                                                            color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff'
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4 flex-shrink-0',
                                                                config.model === model.id ? 'opacity-100' : 'opacity-0'
                                                            )}
                                                        />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="text-sm truncate">{model.name}</span>
                                                            <span
                                                                className="text-xs truncate"
                                                                style={{ color: themeSettings?.theme_preset === 'light' ? '#6b7280' : '#9ca3af' }}
                                                            >
                                                                {model.id}
                                                            </span>
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
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Max Tokens: {config.max_tokens}
                            </Label>
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
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Temperature: {config.temperature}
                            </Label>
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
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Cache Threshold: {config.cache_threshold}
                            </Label>
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
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Stream Responses
                            </Label>
                            <Switch
                                checked={config.stream}
                                onCheckedChange={(checked) => setConfig({ ...config, stream: checked })}
                            />
                        </div>

                        {/* Is Cached Toggle */}
                        <div className="flex items-center justify-between py-2">
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Use Cache
                            </Label>
                            <Switch
                                checked={config.is_cached}
                                onCheckedChange={(checked) => setConfig({ ...config, is_cached: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <Label
                                className="text-sm font-medium"
                                style={{ color: themeSettings?.theme_preset === 'light' ? '#1f2937' : '#ffffff' }}
                            >
                                Use Rag
                            </Label>
                            <Switch
                                checked={config.use_rag}
                                onCheckedChange={(checked) => setConfig({ ...config, use_rag: checked })}
                            />
                        </div>

                        {/* Current Config Display */}
                        {/* <div className="mt-6 p-4 bg-[#2f2f2f] rounded-lg border border-[#565869]">
                            <div className="text-xs text-slate-400 mb-2 font-medium">Current Configuration:</div>
                            <pre className="text-xs text-slate-300 overflow-auto">
                                {JSON.stringify(config, null, 2)}
                            </pre>
                        </div> */}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
