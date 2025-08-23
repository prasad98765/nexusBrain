import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Loader2 } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const workspaceId = urlParams.get('workspace');
  const agentId = urlParams.get('agent');
  const conversationId = urlParams.get('conversation');

  // Fetch agent flow
  useQuery({
    queryKey: ['/api/agents', agentId, 'flow'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/flow`);
      if (!response.ok) throw new Error('Failed to fetch agent flow');
      const data = await response.json();
      if (data.flow) {
        setAgentFlow(data.flow);
        initializeFlow(data.flow);
      }
      return data;
    },
    enabled: !!agentId
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

  return (
    <div className="flex flex-col h-screen bg-slate-50" data-testid="chatbot-interface">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p>Start a conversation with the AI assistant</p>
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
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <Card className={`p-3 ${
                message.sender === 'user' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white border-slate-200'
              }`}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-indigo-100' : 'text-slate-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </Card>
              
              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <Card className="p-3 bg-white border-slate-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
            data-testid="input-message"
          />
          <Button 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
            className="bg-indigo-500 hover:bg-indigo-600"
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}