import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Loader2, MessageCircle, Home, Phone, ArrowLeft } from 'lucide-react';
import { url } from 'inspector';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface FlowNode {
  id: string;
  type: 'start' | 'input' | 'botknowledge' | 'end';
  data: {
    label: string;
    message?: string;
    knowledgeType?: string;
    knowledgeContent?: string;
  };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

interface AgentFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [agentFlow, setAgentFlow] = useState<AgentFlow | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [agentTheme, setAgentTheme] = useState<any>(null);
  const [currentInput, setCurrentInput] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const workspaceId = "d122d86a-3827-450d-a246-76468b0cb956" 
  const agentId = "88c3eaf8-cf52-49ce-af94-42108c4b2a88";
  const conversationId = urlParams.get('conversation_id') || null;

  // Fetch agent theme and info
  const { data: agentInfo } = useQuery({
    queryKey: ['/api/agents', agentId, 'embed-info'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/embed-info?workspace_id=${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch agent info');
      const data = await response.json();
      setAgentTheme(data.theme);
      if (data.flow) {
        setAgentFlow(data.flow);
      }
      return data;
    },
    enabled: !!agentId && !!workspaceId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/conversations/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,
          agentId,
          conversationId,
          message,
          sender: 'user'
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data) => {
      // Add user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: inputMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Process the message through the flow
      processFlow(inputMessage);
      setInputMessage('');
    }
  });

  // Initialize flow with start node
  const initializeFlow = (flow: AgentFlow) => {
    const startNode = flow.nodes.find(node => node.type === 'start');
    if (startNode) {
      setCurrentNode(startNode.id);
      if (startNode.data.message) {
        const botMessage: Message = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: startNode.data.message,
          timestamp: new Date().toISOString()
        };
        setMessages([botMessage]);
      }
    }
  };

  // Process message through flow
  const processFlow = async (userMessage: string) => {
    if (!agentFlow || !currentNode) return;

    setIsLoading(true);
    
    try {
      // Find current node
      const current = agentFlow.nodes.find(node => node.id === currentNode);
      if (!current) return;

      // Find next node
      const nextEdge = agentFlow.edges.find(edge => edge.source === currentNode);
      if (!nextEdge) return;

      const nextNode = agentFlow.nodes.find(node => node.id === nextEdge.target);
      if (!nextNode) return;

      // Process based on node type
      let botResponse = '';
      
      switch (nextNode.type) {
        case 'input':
          // Input nodes just pass through to the next node
          const inputNextEdge = agentFlow.edges.find(edge => edge.source === nextNode.id);
          if (inputNextEdge) {
            const inputNextNode = agentFlow.nodes.find(node => node.id === inputNextEdge.target);
            if (inputNextNode) {
              botResponse = await processNodeResponse(inputNextNode, userMessage);
              setCurrentNode(inputNextNode.id);
            }
          }
          break;
          
        case 'botknowledge':
          botResponse = await processNodeResponse(nextNode, userMessage);
          setCurrentNode(nextNode.id);
          break;
          
        case 'end':
          botResponse = nextNode.data.message || 'Thank you for chatting with me!';
          setCurrentNode(nextNode.id);
          break;
          
        default:
          botResponse = nextNode.data.message || 'I understand.';
          setCurrentNode(nextNode.id);
      }

      if (botResponse) {
        setTimeout(() => {
          const botMessage: Message = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: botResponse,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
        }, 1000);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error processing flow:', error);
      setIsLoading(false);
    }
  };

  // Process node response based on type
  const processNodeResponse = async (node: FlowNode, userMessage: string): Promise<string> => {
    switch (node.type) {
      case 'botknowledge':
        // Use the knowledge content to generate a response
        if (node.data.knowledgeContent) {
          return `Based on my knowledge: ${node.data.knowledgeContent.substring(0, 200)}...`;
        }
        return 'I can help you with that based on my knowledge base.';
        
      case 'input':
        return node.data.message || 'Please tell me more.';
        
      case 'end':
        return node.data.message || 'Thank you for your message!';
        
      default:
        return node.data.message || 'I understand.';
    }
  };

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    sendMessageMutation.mutate(inputMessage);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start chat flow
  const startChat = () => {
    setShowWelcome(false);
    if (agentFlow) {
      initializeFlow(agentFlow);
    }
  };

  // Render welcome screen
  const renderWelcomeScreen = () => (
    <div 
      className="flex flex-col h-full"
      style={{ 
        backgroundColor: agentTheme?.backgroundColor || '#ffffff',
        fontFamily: agentTheme?.fontFamily || 'system-ui',
        color: agentTheme?.textColor || '#1f2937'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ 
          backgroundColor: agentTheme?.primaryColor || '#3b82f6',
          color: 'white'
        }}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">{agentInfo?.name || 'ChatBot'}</span>
        </div>
        <button 
          onClick={() => window.parent.postMessage('close-chat', '*')}
          className="text-white hover:text-gray-200 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Welcome Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-6">
        <div className="bg-blue-100 rounded-full p-4 mb-2">
          <MessageCircle 
            className="h-8 w-8" 
            style={{ color: agentTheme?.primaryColor || '#3b82f6' }}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">How can we help you today?</h2>
          <p className="text-sm opacity-75 mb-1">👋</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <div 
            className="flex items-center p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
            style={{ backgroundColor: agentTheme?.backgroundColor || '#ffffff' }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: agentTheme?.primaryColor || '#3b82f6' }}
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Let me know if you have any questions!</div>
            </div>
          </div>

          <Button
            onClick={startChat}
            className="w-full font-medium py-3"
            style={{ 
              backgroundColor: agentTheme?.primaryColor || '#3b82f6',
              borderRadius: agentTheme?.borderRadius || '8px'
            }}
            data-testid="button-start-chat"
          >
            Chat with us
          </Button>
        </div>

        {/* Footer Options */}
        <div className="w-full max-w-xs space-y-2 pt-4">
          <div className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <span className="mr-2">⚡</span>
              <span className="text-sm">Start free trial</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <span className="mr-2">📚</span>
              <span className="text-sm">Visit Help Center</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-center space-x-8 pt-6 border-t w-full">
          <button className="flex flex-col items-center space-y-1 text-gray-600 hover:text-gray-800">
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-600 hover:text-gray-800">
            <Phone className="h-5 w-5" />
            <span className="text-xs">Contact</span>
          </button>
        </div>

        {/* Powered By */}
        <div className="text-xs text-gray-500 pt-2">
          Powered by <strong>Nexus AI</strong>
        </div>
      </div>
    </div>
  );

  // Render loading animation
  const renderTypingLoader = () => (
    <div className="flex justify-start mb-4">
      <div className="flex items-start space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex space-x-1">
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (showWelcome) {
    return (
      <div className="h-screen" data-testid="chatbot-interface">
        {renderWelcomeScreen()}
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-screen"
      style={{ 
        backgroundColor: agentTheme?.backgroundColor || '#f8fafc',
        fontFamily: agentTheme?.fontFamily || 'system-ui'
      }}
      data-testid="chatbot-interface"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ 
          backgroundColor: agentTheme?.primaryColor || '#3b82f6',
          color: 'white'
        }}
      >
        <div className="flex items-center space-x-2">
          <ArrowLeft 
            className="h-5 w-5 cursor-pointer hover:text-gray-200" 
            onClick={() => setShowWelcome(true)}
          />
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">{agentInfo?.name || 'ChatBot'}</span>
        </div>
        <button 
          onClick={() => window.parent.postMessage('close-chat', '*')}
          className="text-white hover:text-gray-200 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8" style={{ color: agentTheme?.textColor || '#64748b' }}>
            <div 
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: agentTheme?.primaryColor || '#3b82f6' }}
            >
              <Bot className="h-6 w-6 text-white" />
            </div>
            <p>Hello there! 👋 It's nice to meet you!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${message.sender}-${message.id}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}>
              {message.sender === 'bot' && (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: agentTheme?.primaryColor || '#3b82f6' }}
                >
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`p-3 rounded-2xl shadow-sm ${
                message.sender === 'user' 
                  ? 'text-white' 
                  : 'bg-white border'
              }`}
              style={{
                backgroundColor: message.sender === 'user' 
                  ? agentTheme?.primaryColor || '#3b82f6'
                  : '#ffffff',
                color: message.sender === 'user' 
                  ? 'white' 
                  : agentTheme?.textColor || '#1f2937'
              }}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 opacity-75`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && renderTypingLoader()}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Input Area */}
      <div 
        className="border-t p-4"
        style={{ 
          backgroundColor: agentTheme?.backgroundColor || '#ffffff',
          borderColor: '#e5e7eb'
        }}
      >
        {currentInput ? (
          <div className="space-y-3">
            {currentInput.type === 'text' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: agentTheme?.textColor }}>
                  {currentInput.label}
                </label>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={currentInput.placeholder || 'Type your answer...'}
                  className="w-full"
                  disabled={isLoading}
                  data-testid="input-message"
                />
              </div>
            )}
            
            {currentInput.type === 'select' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: agentTheme?.textColor }}>
                  {currentInput.label}
                </label>
                <Select onValueChange={setInputMessage} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={currentInput.placeholder || 'Select an option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentInput.options?.map((option: string, index: number) => (
                      <SelectItem key={index} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {currentInput.type === 'buttons' && (
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: agentTheme?.textColor }}>
                  {currentInput.label}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {currentInput.options?.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => {
                        setInputMessage(option);
                        handleSendMessage({ preventDefault: () => {} } as React.FormEvent);
                      }}
                      className="text-left justify-start"
                      disabled={isLoading}
                      style={{
                        borderColor: agentTheme?.primaryColor || '#3b82f6',
                        color: agentTheme?.textColor || '#1f2937'
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-full font-medium"
              style={{ 
                backgroundColor: agentTheme?.primaryColor || '#3b82f6',
                borderRadius: agentTheme?.borderRadius || '8px'
              }}
              data-testid="button-send"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 rounded-full"
              disabled={isLoading}
              data-testid="input-message"
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading}
              className="rounded-full p-2"
              style={{ backgroundColor: agentTheme?.primaryColor || '#3b82f6' }}
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}