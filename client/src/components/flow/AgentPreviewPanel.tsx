/**
 * Agent Preview Panel Component
 * 
 * Displays an interactive chat preview using server-driven step-by-step execution.
 * The server controls the flow and tells the client what to display at each step.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Bot, User, Sparkles, Bug, History, Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
    role: 'user' | 'assistant' | 'interactive';
    content: string;
    timestamp: Date;
    buttons?: Array<{ id: string; label: string; actionType: string; actionValue?: string }>;
}

interface StepState {
    user_data: Record<string, any>;
    messages: Array<{ role: string; content: string }>;
    workspace_id?: string;
    agent_id?: string;
    conversation_id?: string;
}

interface UISchema {
    type: 'interactive' | 'input' | 'processing' | 'complete' | 'info';
    message?: string;
    buttons?: Array<{ id: string; label: string; actionType: string; actionValue?: string }>;
    label?: string;
    inputType?: string;
    placeholder?: string;
    expects_input: boolean;
}

interface AgentPreviewPanelProps {
    agentId: string;
    agentName?: string;
    onClose: () => void;
}

export default function AgentPreviewPanel({ agentId, agentName = 'Agent', onClose }: AgentPreviewPanelProps) {
    const { token } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [nextNodeId, setNextNodeId] = useState<string | null>(null);
    const [flowState, setFlowState] = useState<StepState>({
        user_data: {},
        messages: []
    });
    const [uiSchema, setUiSchema] = useState<UISchema | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [conversationId, setConversationId] = useState<string>('');
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);
    const [debugLoading, setDebugLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAutoProceeding = useRef(false);

    // Initialize flow by executing first step
    useEffect(() => {
        initializeFlow();
    }, [agentId]);

    const initializeFlow = async () => {
        setIsLoading(true);
        try {
            // Start the flow - server will determine first node
            const response = await fetch('/api/langgraph/step', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    user_input: '',
                    user_data: {},
                    messages: [],
                    conversation_id: "1"
                })
            });

            const data = await response.json();

            if (data.success) {
                handleStepResponse(data);
            } else {
                // Fallback welcome message
                setMessages([{
                    role: 'assistant',
                    content: data.response || `Hello! I'm ${agentName}. How can I help you today?`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to initialize flow:', error);
            setMessages([{
                role: 'assistant',
                content: `Hello! I'm ${agentName}. How can I help you today?`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle response from step execution
    const handleStepResponse = (data: any) => {
        console.log('[AgentPreviewPanel] handleStepResponse:', {
            current_node_id: data.current_node_id,
            next_node_id: data.next_node_id,
            ui_schema: data.ui_schema,
            expects_input: data.ui_schema?.expects_input,
            is_complete: data.is_complete,
            isAutoProceeding: isAutoProceeding.current
        });

        setCurrentNodeId(data.current_node_id);
        setNextNodeId(data.next_node_id);
        setFlowState(data.state || { user_data: {}, messages: [] });
        setUiSchema(data.ui_schema);
        setIsComplete(data.is_complete || false);

        // Capture conversation ID for debugging
        if (data.state?.conversation_id) {
            console.log('[Debug] Conversation ID captured:', data.state.conversation_id);
            setConversationId(data.state.conversation_id);
        } else {
            console.log('[Debug] No conversation ID in response:', data.state);
        }

        // Display message based on UI schema
        if (data.ui_schema && data.response) {
            const newMessage: Message = {
                role: data.ui_schema.type === 'interactive' ? 'interactive' : 'assistant',
                content: data.response,
                timestamp: new Date(),
                buttons: data.ui_schema.buttons
            };
            setMessages(prev => [...prev, newMessage]);
        }

        // Auto-proceed if expects_input is false
        const shouldAutoProceed = data.ui_schema &&
            data.ui_schema.expects_input === false &&
            data.next_node_id &&
            !data.is_complete &&
            !isAutoProceeding.current;

        console.log('[AgentPreviewPanel] Should auto-proceed?', shouldAutoProceed, {
            has_ui_schema: !!data.ui_schema,
            expects_input: data.ui_schema?.expects_input,
            has_next_node: !!data.next_node_id,
            is_complete: data.is_complete,
            is_auto_proceeding: isAutoProceeding.current
        });

        if (shouldAutoProceed) {
            console.log('[AgentPreviewPanel] Auto-proceeding to next node:', data.next_node_id);
            isAutoProceeding.current = true;
            // Use a small delay to allow the message to be displayed first
            setTimeout(() => {
                console.log('[AgentPreviewPanel] Executing next step');
                // Execute with the next_node_id from the response data, not state
                executeNextStepDirect(data.next_node_id, '', data.state);
                isAutoProceeding.current = false;
            }, 500);
        }
    };

    // Execute next step directly with node_id (for auto-proceed)
    const executeNextStepDirect = async (nodeId: string, userInput: string, state: StepState) => {
        console.log('[AgentPreviewPanel] executeNextStepDirect called:', { nodeId, userInput });

        if (!nodeId || isComplete) {
            console.log('[AgentPreviewPanel] Skipping execution - no node or flow complete');
            return;
        }

        setIsLoading(true);

        try {
            console.log('[AgentPreviewPanel] Sending request to /api/langgraph/step');
            const response = await fetch('/api/langgraph/step', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    node_id: nodeId,
                    user_input: userInput,
                    user_data: state.user_data,
                    messages: state.messages,
                    conversation_id: state.conversation_id
                })
            });

            const data = await response.json();

            if (data.success) {
                handleStepResponse(data);
            } else {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: data.response || 'I encountered an error processing your request.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Step execution error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Connection error. Please check your network and try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Execute next step with user input
    const executeNextStep = async (userInput: string) => {
        console.log('[AgentPreviewPanel] executeNextStep called:', {
            userInput,
            nextNodeId,
            isComplete,
            willExecute: !(!nextNodeId || isComplete)
        });

        if (!nextNodeId || isComplete) {
            console.log('[AgentPreviewPanel] Skipping execution - no next node or flow complete');
            return;
        }

        setIsLoading(true);

        try {
            console.log('[AgentPreviewPanel] Sending request to /api/langgraph/step');
            const response = await fetch('/api/langgraph/step', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    node_id: nextNodeId,
                    user_input: userInput,
                    user_data: flowState.user_data,
                    messages: flowState.messages,
                    conversation_id: flowState.conversation_id
                })
            });

            const data = await response.json();

            if (data.success) {
                handleStepResponse(data);
            } else {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: data.response || 'I encountered an error processing your request.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Step execution error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Connection error. Please check your network and try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle button click from interactive message
    const handleButtonClick = (button: { id: string; label: string; actionType: string; actionValue?: string }) => {
        // Add user's choice as a message
        const userMessage: Message = {
            role: 'user',
            content: button.label,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Execute next step with button label as input
        executeNextStep(button.label);
    };

    // Handle text input send
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const userInput = inputMessage;
        setInputMessage('');

        // Execute next step with user input
        executeNextStep(userInput);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Fetch debug data
    const fetchDebugData = async () => {
        if (!conversationId || !token) {
            console.log('[Debug] Cannot fetch debug data:', { conversationId, hasToken: !!token });
            return;
        }

        console.log('[Debug] Fetching debug data for conversation:', conversationId);
        setDebugLoading(true);
        try {
            const [stateRes, historyRes, memoryRes] = await Promise.all([
                fetch('/api/langgraph/debug/state', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        agent_id: agentId,
                        conversation_id: conversationId
                    })
                }),
                fetch('/api/langgraph/debug/history', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        agent_id: agentId,
                        conversation_id: conversationId
                    })
                }),
                fetch('/api/langgraph/debug/memory', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        agent_id: agentId,
                        conversation_id: conversationId
                    })
                })
            ]);

            console.log('[Debug] Response statuses:', {
                state: stateRes.status,
                history: historyRes.status,
                memory: memoryRes.status
            });

            const state = await stateRes.json();
            const history = await historyRes.json();
            const memory = await memoryRes.json();

            console.log('[Debug] Fetched data:', { state, history, memory });

            setDebugData({
                state: state.state || {},
                checkpoints: history.checkpoints || [],
                memory: memory.summary || {}
            });
        } catch (error) {
            console.error('[Debug] Failed to fetch debug data:', error);
        } finally {
            setDebugLoading(false);
        }
    };

    // Replay from checkpoint
    const handleReplayCheckpoint = async (checkpointId: string) => {
        if (!conversationId || !token) return;

        try {
            const response = await fetch('/api/langgraph/debug/replay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    checkpoint_id: checkpointId,
                    agent_id: agentId
                })
            });

            const data = await response.json();
            if (data.success) {
                // Reload the conversation from the checkpoint
                setFlowState(data.state);
                setMessages(data.state.messages || []);
                setCurrentNodeId(data.current_node);
                setIsComplete(false);
                toast({
                    title: 'Success',
                    description: 'Successfully replayed to checkpoint'
                });
                fetchDebugData();
            }
        } catch (error) {
            console.error('Failed to replay checkpoint:', error);
            toast({
                title: 'Error',
                description: 'Failed to replay checkpoint',
                variant: 'destructive'
            });
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch debug data when conversation starts
    useEffect(() => {
        if (conversationId && showDebugPanel) {
            fetchDebugData();
        }
    }, [conversationId, showDebugPanel]);

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#0a0e14] border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl h-[700px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-100">Agent Preview</h3>
                            <p className="text-xs text-gray-400">{agentName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* {conversationId && ( */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDebugPanel(!showDebugPanel)}
                            className={`${showDebugPanel
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Bug className="h-4 w-4 mr-1" />
                            Debug
                        </Button>
                        {/* )} */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Chat Area */}
                    <div className={`flex flex-col ${showDebugPanel ? 'w-1/2 border-r border-gray-700' : 'w-full'}`}>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {(message.role === 'assistant' || message.role === 'interactive') && (
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="max-w-[70%]">
                                        <div
                                            className={`rounded-lg p-3 ${message.role === 'user'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-800 text-gray-100'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            <p className="text-xs opacity-60 mt-1">
                                                {message?.timestamp?.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        {/* Interactive Buttons */}
                                        {message.role === 'interactive' && message.buttons && message.buttons.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {message.buttons.map((button, btnIndex) => (
                                                    <Button
                                                        key={btnIndex}
                                                        onClick={() => handleButtonClick(button)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                                                    >
                                                        {button.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                                <User className="h-4 w-4 text-gray-300" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                                            <span className="text-sm text-gray-400">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gray-700 p-4">
                            <div className="flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={isComplete ? "Flow completed" : (uiSchema?.expects_input === false ? "Processing..." : "Type your message...")}
                                    disabled={isLoading || isComplete || uiSchema?.expects_input === false}
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !inputMessage.trim() || isComplete || uiSchema?.expects_input === false}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {isComplete
                                    ? "Flow completed"
                                    : uiSchema?.expects_input === false
                                        ? "Auto-proceeding to next step..."
                                        : "Press Enter to send • This is a preview of your agent's behavior"}
                            </p>
                        </div>
                    </div>

                    {/* Debug Panel */}
                    {showDebugPanel && (
                        <div className="w-1/2 flex flex-col bg-[#0d1117]">
                            <Tabs defaultValue="checkpoints" className="flex-1 flex flex-col">
                                <div className="border-b border-gray-700 px-4 pt-3">
                                    <TabsList className="bg-gray-800/50">
                                        <TabsTrigger value="checkpoints" className="text-xs">
                                            <History className="h-3 w-3 mr-1" />
                                            Checkpoints
                                        </TabsTrigger>
                                        <TabsTrigger value="state" className="text-xs">
                                            <Database className="h-3 w-3 mr-1" />
                                            State
                                        </TabsTrigger>
                                        <TabsTrigger value="memory" className="text-xs">
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Memory
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <ScrollArea className="flex-1">
                                    {/* Checkpoints Tab */}
                                    <TabsContent value="checkpoints" className="p-4 space-y-3 m-0">
                                        {debugLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                                            </div>
                                        ) : debugData?.checkpoints && debugData.checkpoints.length > 0 ? (
                                            <>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-300">Timeline</h4>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={fetchDebugData}
                                                        className="h-7 text-xs"
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Refresh
                                                    </Button>
                                                </div>
                                                {debugData.checkpoints.map((checkpoint: any, idx: number) => (
                                                    <div
                                                        key={checkpoint.checkpoint_id}
                                                        className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-700"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-gray-500'
                                                                    }`} />
                                                                <span className="text-xs font-mono text-gray-400">
                                                                    {checkpoint.checkpoint_id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                            <Badge variant={idx === 0 ? 'default' : 'secondary'} className="text-xs">
                                                                {idx === 0 ? 'Current' : `Step ${debugData.checkpoints.length - idx}`}
                                                            </Badge>
                                                        </div>

                                                        <div className="text-xs text-gray-400">
                                                            <div>Node: <span className="text-indigo-400">{checkpoint.node_id}</span></div>
                                                            <div>Time: {new Date(checkpoint.timestamp * 1000).toLocaleTimeString()}</div>
                                                        </div>

                                                        {idx > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleReplayCheckpoint(checkpoint.checkpoint_id)}
                                                                className="w-full h-7 text-xs border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                                                            >
                                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                                Replay from here
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                No checkpoints yet. Start a conversation to see the execution timeline.
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* State Tab */}
                                    <TabsContent value="state" className="p-4 m-0">
                                        {debugLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                                            </div>
                                        ) : debugData?.state ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium text-gray-300">Current State</h4>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={fetchDebugData}
                                                        className="h-7 text-xs"
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Refresh
                                                    </Button>
                                                </div>
                                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                    <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                                        {JSON.stringify(debugData.state, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                No state data available
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Memory Tab */}
                                    <TabsContent value="memory" className="p-4 m-0">
                                        {debugLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                                            </div>
                                        ) : debugData?.memory ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium text-gray-300">Memory Summary</h4>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={fetchDebugData}
                                                        className="h-7 text-xs"
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Refresh
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="text-xs text-gray-400 mb-1">Total Messages</div>
                                                        <div className="text-lg font-semibold text-indigo-400">
                                                            {debugData.memory.total_messages || 0}
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="text-xs text-gray-400 mb-1">User Data Keys</div>
                                                        <div className="text-xs text-gray-300 mt-1">
                                                            {debugData.memory.user_data_keys?.length > 0
                                                                ? debugData.memory.user_data_keys.join(', ')
                                                                : 'None'}
                                                        </div>
                                                    </div>

                                                    {debugData.memory.last_node && (
                                                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                            <div className="text-xs text-gray-400 mb-1">Last Executed Node</div>
                                                            <div className="text-xs font-mono text-indigo-400">
                                                                {debugData.memory.last_node}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                No memory data available
                                            </div>
                                        )}
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
